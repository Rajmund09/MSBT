const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { verifyToken, requirePermission } = require('../middleware/auth');

router.post('/', verifyToken, requirePermission('calendar', 'create'), taskController.createTask);
router.put('/:id', verifyToken, requirePermission('calendar', 'edit'), taskController.updateTask);
router.delete('/:id', verifyToken, requirePermission('calendar', 'delete'), taskController.deleteTask);
router.get('/calendar', verifyToken, requirePermission('calendar', 'view'), taskController.getCalendarEvents);

module.exports = router;
