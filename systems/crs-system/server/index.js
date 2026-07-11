import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

import { initKafkaProducer } from './kafka.js';
import router from './routes/login-route.js';

// Kafka initialization
await initKafkaProducer();

const allowedOrigins = ['http://localhost:45173', 'http://localhost:45174', 'http://localhost:45175', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://127.0.0.1:45173', 'http://127.0.0.1:45174', 'http://127.0.0.1:45175', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174', 'http://127.0.0.1:5175'];

// Express server setup
const app = express();
const server = http.createServer(app);
const PORT = 4002;
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use('/api', router);
server.listen(PORT, () => {
    console.log(`CRS System Server is listening on http://localhost:${PORT}`);
});

// Inject Websocket Socket.io server 
// const io = new Server(server, {
//     cors: { origin: allowedOrigins, methods: ['GET', 'POST'], credentials: true }
// });
// io.on('connection', (socket) => {
//     console.log("Client connected: ", socket.id);
//     socket.emit('initial-messages', getLoginEvents());
// });




