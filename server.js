const express = require('express');
const cors = require('cors');
const kafka = require('./kafkaClient');

const app = express();
app.use(cors());
app.use(express.json());

const TOPIC = 'test-topic';
const GROUP_ID = 'intranet-portal-group';

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: GROUP_ID });

// In-memory buffer of recently consumed messages, newest first
const recentMessages = [];
const MAX_MESSAGES = 100;

async function startKafka() {
  await producer.connect();
  console.log('Producer connected to Kafka');

  await consumer.connect();
  console.log('Consumer connected to Kafka');

  await consumer.subscribe({ topic: TOPIC, fromBeginning: true });

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
    },
  });
}

// POST /api/send  body: { event, studentId }
app.post('/api/send', async (req, res) => {
  try {
    const { event, studentId } = req.body;
    if (!event || !studentId) {
      return res.status(400).json({ error: 'event and studentId are required' });
    }

    const payload = { event, studentId, timestamp: Date.now() };

    await producer.send({
      topic: TOPIC,
      messages: [{ value: JSON.stringify(payload) }],
    });

    res.json({ status: 'sent', payload });
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// GET /api/messages - poll for recent consumed messages
app.get('/api/messages', (req, res) => {
  res.json({ messages: recentMessages });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});

startKafka().catch((err) => {
  console.error('Failed to start Kafka producer/consumer:', err);
  process.exit(1);
});