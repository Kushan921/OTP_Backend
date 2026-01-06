const express = require('express');
const router = express.Router();
const emailAccountController = require('../../controller/emailAccount/EmailAccountController');

router.post('/assign', emailAccountController.assignType);
router.post('/unassign', emailAccountController.unassignType);

router.post('/', emailAccountController.createEmailAccount);
router.get('/', emailAccountController.getAllEmailAccounts);
router.get('/count', emailAccountController.countEmailAccounts);
router.get('/:id', emailAccountController.getEmailAccountById);
router.put('/:id', emailAccountController.updateEmailAccount);
router.delete('/:id', emailAccountController.deleteEmailAccount);




module.exports = router;
