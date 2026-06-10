const express = require('express');
const router = express.Router();
const entryController = require('../controllers/entryController');
const { verifyToken, requireRole, requirePermission } = require('../middleware/auth');

router.post('/', verifyToken, requirePermission('entries', 'create'), entryController.createEntry);
router.get('/', verifyToken, requirePermission('entries', 'view'), entryController.getAllEntries);
router.delete('/:id', verifyToken, requirePermission('entries', 'delete'), entryController.deleteEntry);

module.exports = router;
