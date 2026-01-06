const express = require('express');
const router = express.Router();
const OTPController = require('../../controller/otp/OTPController');

router.post('/request', OTPController.requestOTP);
router.get('/:sessionId', OTPController.getOTPBySession);

module.exports = router;
