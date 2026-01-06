const OTPService = require('../../service/otp/OTPService');
const AccountType = require('../../model/accountType/AccountType');

module.exports = {
  requestOTP: async (req, res) => {
    try {
     
      const { customerId, accountTypeId, otpType } = req.body;

      // Fetch account type to check if it's Netflix
      const accountType = await AccountType.findByPk(accountTypeId);
      if (!accountType) {
        return res.status(400).json({ error: 'AccountType not found' });
      }

      // otpType is required only for Netflix
      if (accountType.name.toLowerCase() === 'netflix' && !otpType) {
        return res.status(400).json({ error: 'otpType is required for Netflix accounts' });
      }

      const result = await OTPService.createOTPRequest(
        customerId,
        accountTypeId,
        otpType
      );
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getOTPBySession: async (req, res) => {
    try {
      const { sessionId } = req.params;
      const otp = await OTPService.getOTPBySession(sessionId);
      res.json(otp);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },
};
