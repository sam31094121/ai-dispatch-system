const express = require('express');
const router = express.Router();
const os = require('os');
const { appConfig } = require('../config/appConfig');

function getLanIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

router.get('/', (req, res) => {
  res.json({ 
    version: appConfig.version,
    lanIp: getLanIp(),
    port: appConfig.port || 3001
  });
});

module.exports = router;
