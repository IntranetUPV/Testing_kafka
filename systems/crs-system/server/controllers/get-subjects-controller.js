import { getStudentSubjects } from './../models/login-model.js';

async function getSubjectsController(req, res) {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({ error: 'studentId is required.' });
    }

    const subjects = getStudentSubjects(studentId);
    res.status(200).json({ subjects });
  } catch (error) {
    console.error('Error reading subjects:', error);
    res.status(500).json({ error: 'Failed to read subjects' });
  }
}

export default getSubjectsController;