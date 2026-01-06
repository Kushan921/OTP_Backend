const Customer = require("../../model/Customer/Customer");
const AccountType = require("../../model/accountType/AccountType");
const EmailAccount = require("../../model/emailAccount/EmailAccount");
const bcrypt = require("bcrypt");

class CustomerService {
  static async createCustomer({ name, email, password, isActive = true }) {
    try {
      if (!email || !password || !name)
        throw new Error("All fields are required");
      const existing = await Customer.findOne({ where: { email } });
      if (existing) throw new Error("Email already exists");
      const hashedPassword = await bcrypt.hash(password, 10);
      return await Customer.create({
        name,
        email,
        password: hashedPassword,
        isActive,
      });
    } catch (error) {
      throw new Error(error.message);
    }
  }

  static async getAllCustomers() {
    try {
      const customers = await Customer.findAll({
        include: [
          {
            model: AccountType,
            through: { attributes: [] },
            include: [
              {
                model: EmailAccount,
                through: { attributes: [] },
              },
            ],
          },
          {
            model: EmailAccount,
            through: { attributes: [] },
            attributes: ["id"],
          },
        ],
      });

      return customers.map((customer) => {
        const customerPlain = customer.get({ plain: true });
        const assignedEmailIds = new Set(
          customerPlain.EmailAccounts.map((e) => e.id)
        );

        const filteredAccountTypes = customerPlain.AccountTypes.map((at) => {
          const filteredEmails = at.EmailAccounts.filter((email) =>
            assignedEmailIds.has(email.id)
          );
          return {
            ...at,
            EmailAccounts: filteredEmails,
          };
        });

        const { EmailAccounts, ...rest } = customerPlain;
        return {
          ...rest,
          AccountTypes: filteredAccountTypes,
        };
      });
    } catch (error) {
      throw new Error(error.message);
    }
  }

  static async getCustomerById(id) {
    try {
      const customer = await Customer.findByPk(id, {
        include: [
          {
            model: AccountType,
            through: { attributes: [] },
            include: [
              {
                model: EmailAccount,
                through: { attributes: [] },
              },
            ],
          },
          {
            model: EmailAccount,
            through: { attributes: [] },
            attributes: ["id"],
          },
        ],
      });

      if (!customer) throw new Error("Customer not found");
      const customerPlain = customer.get({ plain: true });
      const assignedEmailIds = new Set(
        customerPlain.EmailAccounts.map((e) => e.id)
      );

      const filteredAccountTypes = customerPlain.AccountTypes.map((at) => {
        const filteredEmails = at.EmailAccounts.filter((email) =>
          assignedEmailIds.has(email.id)
        );
        return {
          ...at,
          EmailAccounts: filteredEmails,
        };
      });

      const { EmailAccounts, ...rest } = customerPlain;
      return {
        ...rest,
        AccountTypes: filteredAccountTypes,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  static async updateCustomer(id, data) {
    try {
      const customer = await Customer.findByPk(id);
      if (!customer) throw new Error("Customer not found");

      if (data.name) customer.name = data.name;
      if (data.email) customer.email = data.email;
      if (data.isActive !== undefined) customer.isActive = data.isActive;

      if (data.password) {
        customer.password = await bcrypt.hash(data.password, 10);
      }

      await customer.save();
      return customer;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  static async deleteCustomer(id) {
    try {
      const customer = await Customer.findByPk(id);
      if (!customer) throw new Error("Customer not found");

      await customer.destroy();
      return { message: "Customer deleted successfully" };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  static async resetPassword(customerId, newPassword) {
    try {
      const customer = await Customer.findByPk(customerId);
      if (!customer) throw new Error("Customer not found");

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      customer.password = hashedPassword;
      await customer.save();

      return { message: "Password reset successfully" };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  static async login(email, password) {
    try {
      const customer = await Customer.findOne({ 
        where: { email },
        include: [
          {
            model: AccountType,
            through: { attributes: [] },
            include: [
              {
                model: EmailAccount,
                through: { attributes: [] },
              },
            ],
          },
          {
            model: EmailAccount,
            through: { attributes: [] },
            attributes: ["id"],
          },
        ],
      });
      
      if (!customer) throw new Error("Invalid email or password");

      const isMatch = await bcrypt.compare(password, customer.password);
      if (!isMatch) throw new Error("Invalid email or password");

      // Process the data similar to getCustomerById
      const customerPlain = customer.get({ plain: true });
      const assignedEmailIds = new Set(
        (customerPlain.EmailAccounts || []).map((e) => e.id)
      );

      const filteredAccountTypes = (customerPlain.AccountTypes || []).map((at) => {
        const filteredEmails = (at.EmailAccounts || []).filter((email) =>
          assignedEmailIds.has(email.id)
        );
        return {
          ...at,
          EmailAccounts: filteredEmails,
        };
      });

      const { EmailAccounts, ...rest } = customerPlain;
      return {
        ...rest,
        AccountTypes: filteredAccountTypes,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  static async assignAccountType(customerId, accountTypeId, emailAccountId) {
    try {
      const customer = await Customer.findByPk(customerId);
      if (!customer) throw new Error("Customer not found");

      const accountType = await AccountType.findByPk(accountTypeId, {
        include: {
          model: EmailAccount,
          through: { attributes: [] },
        },
      });
      if (!accountType) throw new Error("AccountType not found");

      const isValidEmail = accountType.EmailAccounts?.some(
        (email) => email.id === emailAccountId
      );
      if (!isValidEmail)
        throw new Error(
          "Provided EmailAccount is not linked to this AccountType"
        );

      const emailAccount = await EmailAccount.findByPk(emailAccountId);
      if (!emailAccount) throw new Error("EmailAccount not found");

      await customer.addAccountType(accountType);
      await customer.addEmailAccount(emailAccount);

      return {
        message: "AccountType and selected EmailAccount assigned to customer",
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  static async unassignAccountType(customerId, accountTypeId, emailAccountId) {
    try {
      const customer = await Customer.findByPk(customerId);
      if (!customer) throw new Error("Customer not found");

      const accountType = await AccountType.findByPk(accountTypeId);
      if (!accountType) throw new Error("AccountType not found");

      const emailAccount = await EmailAccount.findByPk(emailAccountId);
      if (!emailAccount) throw new Error("EmailAccount not found");

      await customer.removeAccountType(accountType);
      await customer.removeEmailAccount(emailAccount);

      return {
        message: "AccountType and EmailAccount unassigned from customer",
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

module.exports = CustomerService;
