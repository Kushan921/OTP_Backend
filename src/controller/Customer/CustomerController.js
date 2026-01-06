const CustomerService = require("../../service/Customer/CustomerService");

const customerController = {
  createCustomer: async (req, res) => {
    try {
      const customer = await CustomerService.createCustomer(req.body);
      res.status(201).json(customer);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getAllCustomers: async (req, res) => {
    try {
      const customers = await CustomerService.getAllCustomers();
      res.status(200).json(customers);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getCustomerById: async (req, res) => {
    try {
      const customer = await CustomerService.getCustomerById(req.params.id);
      res.status(200).json(customer);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  updateCustomer: async (req, res) => {
    try {
      const updated = await CustomerService.updateCustomer(
        req.params.id,
        req.body
      );
      res.status(200).json(updated);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  deleteCustomer: async (req, res) => {
    try {
      const result = await CustomerService.deleteCustomer(req.params.id);
      res.status(200).json(result);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const customer = await CustomerService.login(email, password);
      res.status(200).json(customer);
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  },

  assignAccountType: async (req, res) => {
    try {
      const { customerId, accountTypeId, emailAccountId } = req.body;
      const result = await CustomerService.assignAccountType(
        customerId,
        accountTypeId,
        emailAccountId
      );
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  unassignAccountType: async (req, res) => {
    try {
      const { customerId, accountTypeId, emailAccountId } = req.body;
      const result = await CustomerService.unassignAccountType(
        customerId,
        accountTypeId,
        emailAccountId
      );
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  assignEmailAccount: async (req, res) => {
    try {
      const { customerId, emailAccountId } = req.body;
      const result = await CustomerService.assignEmailAccount(
        customerId,
        emailAccountId
      );
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  resetPassword: async (req, res) => {
    try {
      const { customerId, newPassword } = req.body;
      const result = await CustomerService.resetPassword(customerId, newPassword);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
};

module.exports = customerController;
