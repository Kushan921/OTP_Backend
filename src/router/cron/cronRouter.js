const express = require('express');
const router = express.Router();
const processOTPRequests = require('../../worker/otpWorker');

router.get('/test', async (req, res) => {
  try {
    processOTPRequests();
    res.json({ message: 'OTP processing triggered successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;