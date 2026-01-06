const { v4: uuidv4 } = require('uuid');
const OTPRequest = require('../../model/emailAccount/OTPRequest');
const AccountType = require('../../model/accountType/AccountType');
const EmailAccount = require('../../model/emailAccount/EmailAccount');

class OTPService {
  static async createOTPRequest(customerId, accountTypeId, otpType) {
   
    // 1. Validate AccountType
    const accountType = await AccountType.findByPk(accountTypeId, {
      include: {
        model: EmailAccount,
        through: { attributes: [] },
      },
    });

    if (!accountType) throw new Error('AccountType not found');

    // 2. Pick active EmailAccount
    const emailAccount = accountType.EmailAccounts.find(e => e.isActive);
    if (!emailAccount) throw new Error('No active EmailAccount available');

    // 3. Create OTP request
    const sessionId = uuidv4();

    await OTPRequest.create({
      sessionId,
      emailAccountId: emailAccount.id,
      accountType: accountType.name,
      otpType: otpType || null,
      status: 'pending',
    });

    return {
      message: 'OTP request created',
      sessionId,
    };
  }

  static async getOTPBySession(sessionId) {
    const request = await OTPRequest.findOne({ where: { sessionId } });
    if (!request) throw new Error('Invalid session');
    if (request.status !== 'completed') {
      return { status: request.status };
    }

    return {
      otp: request.otp,
      completedAt: request.completedAt,
    };
  }
}

module.exports = OTPService;
