const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { verifyToken, requirePermission } = require('../middleware/auth');

router.post('/', verifyToken, requirePermission('customers', 'create'), customerController.createCustomer);
router.get('/', verifyToken, requirePermission('customers', 'view'), customerController.getAllCustomers);
router.get('/:id', verifyToken, requirePermission('customers', 'view'), customerController.getCustomerById);
router.put('/:id', verifyToken, requirePermission('customers', 'edit'), customerController.updateCustomer);
router.delete('/:id', verifyToken, requirePermission('customers', 'delete'), customerController.deleteCustomer);

module.exports = router;
