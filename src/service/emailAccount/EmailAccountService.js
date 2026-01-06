const EmailAccount = require("../../model/emailAccount/EmailAccount");
const AccountType = require("../../model/accountType/AccountType");

class EmailAccountService {
  static async createEmailAccount({
    email,
    accountTypeId,
    accessToken,
    refreshToken,
    tokenExpires,
    provider,
  }) {
    try {
      if (
        !email ||
        !accessToken ||
        !refreshToken ||
        !tokenExpires ||
        !provider
      ) {
        throw new Error("All required fields must be provided");
      }

      const existing = await EmailAccount.findOne({ where: { email } });
      if (existing) throw new Error("Email already exists");

      const emailAccount = await EmailAccount.create({
        email,
        accessToken,
        refreshToken,
        tokenExpires,
        provider,
      });

      if (accountTypeId) {
        const type = await AccountType.findByPk(accountTypeId);
        if (!type) throw new Error("Provided Account type not found");
        await emailAccount.addAccountType(type);
      }

      return await EmailAccount.findByPk(emailAccount.id, {
        include: {
          model: AccountType,
          through: { attributes: [] },
        },
      });
    } catch (error) {
      throw new Error(error.message);
    }
  }

  static async getAllEmailAccounts({ limit, offset } = {}) {
    try {
      return await EmailAccount.findAll({
        include: {
          model: AccountType,
          through: { attributes: [] },
        },
        limit,
        offset,
      });
    } catch (error) {
      throw new Error(error.message);
    }
  }

  static async getEmailAccountById(id) {
    try {
      const emailAccount = await EmailAccount.findByPk(id, {
        include: {
          model: AccountType,
          through: { attributes: [] },
        },
      });
      if (!emailAccount) throw new Error("Email account not found");
      return emailAccount;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  static async updateEmailAccount(id, updatedData) {
    try {
      const emailAccount = await EmailAccount.findByPk(id);
      if (!emailAccount) throw new Error("Email account not found");

      const updatableFields = [
        "email",
        "accessToken",
        "refreshToken",
        "tokenExpires",
        "provider",
        "isActive",
      ];
      updatableFields.forEach((field) => {
        if (updatedData[field] !== undefined) {
          emailAccount[field] = updatedData[field];
        }
      });

      await emailAccount.save();
      return emailAccount;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  static async deleteEmailAccount(id) {
    try {
      const emailAccount = await EmailAccount.findByPk(id);
      if (!emailAccount) throw new Error("Email account not found");

      await emailAccount.destroy();
      return { message: "Email account deleted successfully" };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  static async assignType(emailAccountIds, accountTypeId) {
    try {
      const type = await AccountType.findByPk(accountTypeId);
      if (!type) throw new Error("Account type not found");

      const emailIds = Array.isArray(emailAccountIds)
        ? emailAccountIds
        : [emailAccountIds];

      for (const id of emailIds) {
        const emailAccount = await EmailAccount.findByPk(id);
        if (!emailAccount)
          throw new Error(`Email account with ID ${id} not found`);
        await emailAccount.addAccountType(type);
      }

      return { message: "Assigned email(s) successfully" };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  static async unassignType(emailAccountIds, accountTypeId) {
    try {
      const type = await AccountType.findByPk(accountTypeId);
      if (!type) throw new Error("Account type not found");

      const emailIds = Array.isArray(emailAccountIds)
        ? emailAccountIds
        : [emailAccountIds];

      for (const id of emailIds) {
        const emailAccount = await EmailAccount.findByPk(id);
        if (!emailAccount)
          throw new Error(`Email account with ID ${id} not found`);
        await emailAccount.removeAccountType(type);
      }

      return { message: "Unassigned email(s) successfully" };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  static async countEmailAccounts() {
    try {
      return await EmailAccount.count();
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

module.exports = EmailAccountService;
