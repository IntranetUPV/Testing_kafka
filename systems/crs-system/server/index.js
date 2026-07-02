import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

import { initKafkaProducer } from './kafka.js';
import router from './routes/login-route.js';

// Kafka initialization
await initKafkaProducer();

// Express server setup
const app = express();
const server = http.createServer(app);
const PORT = 4002;
app.use(cors());
app.use(express.json());
app.use('/api', router);
server.listen(PORT, () => {
    console.log(`CRS System Server is listening on http://localhost:${PORT}`);
});

// Inject Websocket Socket.io server 
// const io = new Server(server, {
//     cors: { origin: '*' }
// });
// io.on('connection', (socket) => {
//     console.log("Client connected: ", socket.id);
//     socket.emit('initial-messages', getLoginEvents());
// });




