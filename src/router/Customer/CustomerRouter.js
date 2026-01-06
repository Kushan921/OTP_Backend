const express = require('express');
const router = express.Router();
const customerController = require('../../controller/Customer/CustomerController');


router.post('/register', customerController.createCustomer);
router.post('/login', customerController.login);
router.get('/', customerController.getAllCustomers);
router.get('/:id', customerController.getCustomerById);
router.put('/:id', customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);

router.post('/assign-account', customerController.assignAccountType);
router.post('/unassign-account', customerController.unassignAccountType);
router.post('/assign-email', customerController.assignEmailAccount);
router.post('/reset-password', customerController.resetPassword);

module.exports = router;
