const AccountTypeService = require("../../service/accountType/AccountTypeService");

module.exports = {
  createAccountType: async (req, res) => {
    try {
      const { name } = req.body;
      const accountType = await AccountTypeService.createAccountType(name);
      res.status(201).json(accountType);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getAllAccountTypes: async (req, res) => {
    try {
      const accountTypes = await AccountTypeService.getAllAccountTypes();
      res.json(accountTypes);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getAccountTypeById: async (req, res) => {
    try {
      const accountType = await AccountTypeService.getAccountTypeById(
        req.params.id
      );
      res.json(accountType);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  updateAccountType: async (req, res) => {
    try {
      const updated = await AccountTypeService.updateAccountType(
        req.params.id,
        req.body
      );
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  deleteAccountType: async (req, res) => {
    try {
      const result = await AccountTypeService.deleteAccountType(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  assignToEmail: async (req, res) => {
    try {
      const { emailAccountId, accountTypeId } = req.body;
      const result = await AccountTypeService.assignToEmail(
        emailAccountId,
        accountTypeId
      );
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  unassignFromEmail: async (req, res) => {
    try {
      const { emailAccountId, accountTypeId } = req.body;
      const result = await AccountTypeService.unassignFromEmail(
        emailAccountId,
        accountTypeId
      );
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
};
