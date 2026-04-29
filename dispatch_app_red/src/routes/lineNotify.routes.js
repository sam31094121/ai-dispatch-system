const express = require('express');
const router = express.Router();
const { sendLineMessage } = require('../services/lineNotify.service');

/**
 * POST /api/line/notify
 * Body: { userId: string, text: string }
 */
router.post('/notify', async (req, res) => {
  const { userId, text } = req.body;
  if (!userId || !text) {
    return res.status(400).json({ error: 'userId and text are required' });
  }
  try {
    const result = await sendLineMessage(userId, text);
    res.json({ success: true, result });
  } catch (err) {
    console.error('LINE Notify error:', err);
    res.status(500).json({ error: err.message, details: err.response });
  }
});

module.exports = router;
