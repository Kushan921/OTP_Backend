const AccountType = require("../../model/accountType/AccountType");
const EmailAccount = require("../../model/emailAccount/EmailAccount");

class AccountTypeService {
  static async createAccountType(name) {
    try {
      if (!name) throw new Error("Name is required");

      const existing = await AccountType.findOne({ where: { name } });
      if (existing) throw new Error("Account type already exists");

      return await AccountType.create({ name });
    } catch (error) {
      throw new Error(error.message);
    }
  }

  static async getAllAccountTypes() {
    try {
      return await AccountType.findAll({
        include: {
          model: EmailAccount,
          through: { attributes: [] },
        },
      });
    } catch (error) {
      throw new Error(error.message);
    }
  }

  static async getAccountTypeById(id) {
    try {
      const accountType = await AccountType.findByPk(id, {
        include: {
          model: EmailAccount,
          through: { attributes: [] },
        },
      });
      if (!accountType) throw new Error("Account type not found");
      return accountType;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  static async updateAccountType(id, updatedData) {
    try {
      const accountType = await AccountType.findByPk(id);
      if (!accountType) throw new Error("Account type not found");

      if (updatedData.name) accountType.name = updatedData.name;

      await accountType.save();
      return accountType;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  static async deleteAccountType(id) {
    try {
      const accountType = await AccountType.findByPk(id);
      if (!accountType) throw new Error("Account type not found");

      await accountType.destroy();
      return { message: "Account type deleted successfully" };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  static async assignToEmail(emailAccountId, accountTypeId) {
    try {
      const email = await EmailAccount.findByPk(emailAccountId);
      const type = await AccountType.findByPk(accountTypeId);
      if (!email || !type) throw new Error("Email or Account type not found");

      await email.addAccountType(type);

      return await AccountType.findByPk(accountTypeId, {
        include: {
          model: EmailAccount,
          through: { attributes: [] },
        },
      });
    } catch (error) {
      throw new Error(error.message);
    }
  }

  static async unassignFromEmail(emailAccountId, accountTypeId) {
    try {
      const email = await EmailAccount.findByPk(emailAccountId);
      const type = await AccountType.findByPk(accountTypeId);
      if (!email || !type) throw new Error("Email or Account type not found");

      await email.removeAccountType(type);

      return await AccountType.findByPk(accountTypeId, {
        include: {
          model: EmailAccount,
          through: { attributes: [] },
        },
      });
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

module.exports = AccountTypeService;
