import { produceKafkaEvent } from './../kafka.js';
import { setLoginAccount, getStudentSubjects } from './../models/login-model.js';

async function loginController(req, res) {
  try {
    const { event, studentId } = req.body;
    if (!event || !studentId) {
      return res.status(400).json({ error: 'event and studentId are required.' });
    }

    const eventData = { event, studentId, timestamp: Date.now() };
    await produceKafkaEvent(eventData);
    setLoginAccount(studentId);
    const subjects = getStudentSubjects(studentId);
    res.status(200).json({ status: `logged in ${studentId}`, studentId, subjects });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
}

export default loginController;
