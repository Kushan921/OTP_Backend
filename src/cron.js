const cron = require('node-cron');
const processOTPRequests = require('./worker/otpWorker');

cron.schedule('*/5 * * * * *', async () => {
  console.log('Checking OTP emails...');
  console.log("✅ Cron job executed at:", new Date().toLocaleTimeString());
  await processOTPRequests();
});
