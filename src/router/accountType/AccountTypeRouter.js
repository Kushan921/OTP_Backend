const express = require('express');
const router = express.Router();
const accountTypeController = require('../../controller/accountType/AccountTypeController');

router.post('/assign', accountTypeController.assignToEmail);
router.post('/unassign', accountTypeController.unassignFromEmail);

router.post('/', accountTypeController.createAccountType);
router.get('/', accountTypeController.getAllAccountTypes);
router.get('/:id', accountTypeController.getAccountTypeById);
router.put('/:id', accountTypeController.updateAccountType);
router.delete('/:id', accountTypeController.deleteAccountType);

module.exports = router;
