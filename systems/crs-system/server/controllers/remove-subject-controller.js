import { removeSubject, getStudentSubjects } from './../models/login-model.js';
import { produceKafkaEvent } from './../kafka.js';

const SYSTEM_NAME = process.env.SYSTEM_NAME || 'crs';

async function removeSubjectController(req, res) {
  try {
    const { studentId, subjectId } = req.params;

    if (!studentId || !subjectId) {
      return res.status(400).json({ error: 'studentId and subjectId are required.' });
    }

    const removed = removeSubject(studentId, subjectId);
    if (!removed) {
      return res.status(404).json({ error: 'Subject not found.' });
    }

    await produceKafkaEvent({
      event: 'subject_removed',
      studentId,
      subjectId,
      timestamp: Date.now(),
      system: SYSTEM_NAME,
    });

    const subjects = getStudentSubjects(studentId);
    res.status(200).json({ subjects });
  } catch (error) {
    console.error('Error removing subject:', error);
    res.status(500).json({ error: 'Failed to remove subject' });
  }
}

export default removeSubjectController;