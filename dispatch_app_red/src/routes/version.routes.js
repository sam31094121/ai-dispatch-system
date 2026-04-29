const express = require('express');
const router = express.Router();
const { appConfig } = require('../config/appConfig');

router.get('/', (req, res) => {
  res.json({ version: appConfig.version });
});

module.exports = router;
