const express = require('express');
const router = express.Router();
const { sendLineMessage, sendLineMulticast } = require('../services/lineNotify.service');

router.post('/notify', async (req, res) => {
  const { userId, text } = req.body;
  if (!userId || typeof userId !== 'string' || !text || typeof text !== 'string') {
    return res.status(400).json({ error: 'userId (string) 和 text (string) 為必填' });
  }
  try {
    const result = await sendLineMessage(userId.trim(), text.trim());
    res.json({ success: true, result });
  } catch (err) {
    console.error('LINE push error:', err.message);
    const status = err.status >= 400 && err.status < 600 ? err.status : 500;
    res.status(status).json({ error: err.message, details: err.response });
  }
});

router.post('/multicast', async (req, res) => {
  const { userIds, text } = req.body;
  if (!Array.isArray(userIds) || userIds.length === 0 || !text || typeof text !== 'string') {
    return res.status(400).json({ error: 'userIds (string[]) 和 text (string) 為必填' });
  }
  try {
    const results = await sendLineMulticast(userIds, text.trim());
    res.json({ success: true, sent: userIds.length, results });
  } catch (err) {
    console.error('LINE multicast error:', err.message);
    const status = err.status >= 400 && err.status < 600 ? err.status : 500;
    res.status(status).json({ error: err.message, details: err.response });
  }
});

module.exports = router;
