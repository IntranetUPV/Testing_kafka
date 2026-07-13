import { produceKafkaEvent } from "./../kafka.js";
import { getLoginEvents, enqueueLoginEvent } from "./../models/login-model.js";

const SYSTEM_NAME = process.env.SYSTEM_NAME || 'tlrc';

export default async function loginController(req, res) {
    try {
        const { event, studentId } = req.body;
        if (!event || !studentId) {
            return res.status(400).json({ error: 'event and studentId are required.' });
        } 
        const eventData = { event, studentId, timestamp: Date.now(), system: SYSTEM_NAME };
        await produceKafkaEvent(eventData);
        enqueueLoginEvent(eventData); 
        res.status(200).json({ status: `sent ${studentId}`, logins: getLoginEvents()});
    } catch (error) {   
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
}