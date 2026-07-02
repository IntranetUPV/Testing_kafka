import express from 'express';
import loginController from './../controllers/login-controller.js';
import logoutController from './../controllers/logout-controller.js';
import getSubjectsController from './../controllers/get-subjects-controller.js';
import addSubjectController from './../controllers/add-subject-controller.js';
import removeSubjectController from './../controllers/remove-subject-controller.js';

const router = express.Router();
router.post('/login', loginController);
router.post('/logout', logoutController);
router.get('/students/:studentId/subjects', getSubjectsController);
router.post('/students/:studentId/subjects', addSubjectController);
router.delete('/students/:studentId/subjects/:subjectId', removeSubjectController);

export default router;