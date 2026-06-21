const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const kafka = require('./kafkaClient');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

// Raw events go IN here, this is what Spark reads and processes
const INPUT_TOPIC = 'test-topic';

// Spark writes its processed results HERE, this is what the frontend displays
const OUTPUT_TOPIC = 'processed-events';

const GROUP_ID = 'intranet-portal-group';

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: GROUP_ID });

// Still keep a small in-memory buffer, so a client that connects AFTER
// some messages already arrived can be caught up immediately on connect
const recentMessages = [];
const MAX_MESSAGES = 100;

async function startKafka() {
  await producer.connect();
  console.log('Producer connected to Kafka');

  await consumer.connect();
  console.log('Consumer connected to Kafka');

  await consumer.subscribe({ topic: OUTPUT_TOPIC, fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const entry = {
        topic,
        partition,
        offset: message.offset,
        value: message.value.toString(),
        receivedAt: new Date().toISOString(),
      };

      recentMessages.unshift(entry);
      if (recentMessages.length > MAX_MESSAGES) {
        recentMessages.pop();
      }

      // Push instantly to every connected browser, no polling needed
      io.emit('processed-message', entry);
    },
  });
}

// When a new browser tab connects, immediately send it the recent history
// so the dashboard isn't empty while waiting for new live events
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.emit('initial-messages', recentMessages);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// POST /api/send  body: { event, studentId }
app.post('/api/send', async (req, res) => {
  try {
    const { event, studentId } = req.body;
    if (!event || !studentId) {
      return res.status(400).json({ error: 'event and studentId are required' });
    }

    const payload = { event, studentId, timestamp: Date.now() };

    await producer.send({
      topic: INPUT_TOPIC,
      messages: [{ value: JSON.stringify(payload) }],
    });

    res.json({ status: 'sent', payload });
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Still kept for convenience / debugging via browser or curl
app.get('/api/messages', (req, res) => {
  res.json({ messages: recentMessages });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`API + WebSocket server listening on http://localhost:${PORT}`);
});

startKafka().catch((err) => {
  console.error('Failed to start Kafka producer/consumer:', err);
  process.exit(1);
});