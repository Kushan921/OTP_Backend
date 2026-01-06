const express = require('express');
const router = express.Router();
const OTPController = require('../../src/worker/otpWorker');

router.get('/cron-job', OTPController);

module.exports = router;