const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { startKafka, getRecentMessages } = require('./models/KafkaModel');
const eventRoutes = require('./routes/eventRoutes');

const allowedOrigins = ['http://localhost:45173', 'http://localhost:45174', 'http://localhost:45175', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://127.0.0.1:45173', 'http://127.0.0.1:45174', 'http://127.0.0.1:45175', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174', 'http://127.0.0.1:5175'];

const app = express();
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use('/api', eventRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'], credentials: true },
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.emit('initial-messages', getRecentMessages());
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

startKafka((entry) => io.emit('processed-message', entry)).catch((err) => {
  console.error('Failed to start Kafka:', err);
  process.exit(1);
});