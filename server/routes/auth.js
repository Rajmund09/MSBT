const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/logout', verifyToken, authController.logout);
router.get('/me', verifyToken, authController.getCurrentUser);
router.put('/me', verifyToken, authController.updateProfile);

// User Management (Owner / Co-Owner only)
router.get('/users', verifyToken, requireRole(['Owner', 'Co-Owner']), authController.getAllUsers);
router.post('/users', verifyToken, requireRole(['Owner', 'Co-Owner']), authController.registerUser);
router.put('/users/:id', verifyToken, requireRole(['Owner', 'Co-Owner']), authController.updateUser);
router.delete('/users/:id', verifyToken, requireRole(['Owner', 'Co-Owner']), authController.deleteUser);
router.delete('/users/:id/permanent', verifyToken, requireRole(['Owner', 'Co-Owner']), authController.hardDeleteUser);

module.exports = router;
