const EmailAccountService = require("../../service/emailAccount/EmailAccountService");

module.exports = {
  createEmailAccount: async (req, res) => {
    try {
      const { email, accountTypeId } = req.body;
      const emailAccount = await EmailAccountService.createEmailAccount(email, accountTypeId);
      res.status(201).json(emailAccount);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getAllEmailAccounts: async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : undefined;
      const emailAccounts = await EmailAccountService.getAllEmailAccounts({ limit, offset });
      res.json(emailAccounts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getEmailAccountById: async (req, res) => {
    try {
      const emailAccount = await EmailAccountService.getEmailAccountById(
        req.params.id
      );
      res.json(emailAccount);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  updateEmailAccount: async (req, res) => {
    try {
      const updated = await EmailAccountService.updateEmailAccount(
        req.params.id,
        req.body
      );
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  deleteEmailAccount: async (req, res) => {
    try {
      const result = await EmailAccountService.deleteEmailAccount(
        req.params.id
      );
      res.json(result);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  assignType: async (req, res) => {
    try {
      const { emailAccountIds, accountTypeId } = req.body;
      const result = await EmailAccountService.assignType(
        emailAccountIds,
        accountTypeId
      );
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  unassignType: async (req, res) => {
    try {
      const { emailAccountIds, accountTypeId } = req.body;
      const result = await EmailAccountService.unassignType(
        emailAccountIds,
        accountTypeId
      );
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  countEmailAccounts: async (req, res) => {
    try {
      const count = await EmailAccountService.countEmailAccounts();
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};
