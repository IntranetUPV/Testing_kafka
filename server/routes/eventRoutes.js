const express = require('express');
const { postEvent, getMessages } = require('../controllers/eventController');

const router = express.Router();

router.post('/send', postEvent);
router.get('/messages', getMessages);

module.exports = router;
