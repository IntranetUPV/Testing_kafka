const { sendEvent, getRecentMessages } = require('../models/KafkaModel');

async function postEvent(req, res) {
  try {
    const { event, studentId } = req.body;
    if (!event || !studentId)
      return res.status(400).json({ error: 'event and studentId are required' });

    const payload = { event, studentId, timestamp: Date.now() };
    await sendEvent(payload);
    res.json({ status: 'sent', payload });
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
}

function getMessages(req, res) {
  res.json({ messages: getRecentMessages() });
}

module.exports = { postEvent, getMessages };