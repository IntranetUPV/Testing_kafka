import { addSubject } from './../models/login-model.js';
import { produceKafkaEvent } from './../kafka.js';

const SYSTEM_NAME = process.env.SYSTEM_NAME || 'crs';

async function addSubjectController(req, res) {
  try {
    const { studentId } = req.params;
    const { name, unit, courseId } = req.body;

    if (!studentId || !name || !unit || !courseId) {
      return res.status(400).json({ error: 'studentId, name, unit, and courseId are required.' });
    }

    const subject = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      unit,
      courseId,
    };

    const subjects = addSubject(studentId, subject);
    await produceKafkaEvent({
      event: 'subject_added',
      studentId,
      subject,
      timestamp: Date.now(),
      system: SYSTEM_NAME,
    });
    res.status(201).json({ subject, subjects });
  } catch (error) {
    console.error('Error adding subject:', error);
    res.status(500).json({ error: 'Failed to add subject' });
  }
}

export default addSubjectController;