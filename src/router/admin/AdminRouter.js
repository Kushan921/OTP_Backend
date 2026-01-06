const express = require('express');
const router = express.Router();
const adminController = require('../../controller/admin/AdminController');
const authenticateToken = require('../../middleware/authMiddleware');


router.post('/', adminController.createAdmin);
router.post('/login', adminController.adminLogin);
router.post('/logout', adminController.adminLogout);
router.post('/refresh-token', adminController.refreshToken);

router.get('/', authenticateToken, adminController.getAllAdmins);
router.get('/profile', authenticateToken, adminController.getProfile);
router.get('/:id', authenticateToken, adminController.getAdminById);
router.put('/:id', authenticateToken, adminController.updateAdmin);
router.delete('/:id', authenticateToken, adminController.deleteAdmin);

module.exports = router;
