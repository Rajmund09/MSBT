const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/summary', verifyToken, dashboardController.getDashboardSummary);
router.get('/audit', verifyToken, requireRole(['Owner', 'Co-Owner', 'Manager']), dashboardController.getAuditLogs);
router.get('/analytics', verifyToken, dashboardController.getAnalytics);

module.exports = router;
