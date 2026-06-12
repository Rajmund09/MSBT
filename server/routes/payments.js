const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken, requireRole, requirePermission } = require('../middleware/auth');

router.post('/', verifyToken, requirePermission('payments', 'create'), paymentController.createPayment);
router.get('/', verifyToken, requirePermission('payments', 'view'), paymentController.getAllPayments);
router.put('/:id', verifyToken, requirePermission('payments', 'edit'), paymentController.updatePayment);
router.delete('/:id', verifyToken, requirePermission('payments', 'delete'), paymentController.deletePayment);

module.exports = router;
