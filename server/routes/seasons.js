const express = require('express');
const router = express.Router();
const seasonController = require('../controllers/seasonController');
const { verifyToken, requireRole, requirePermission } = require('../middleware/auth');

router.post('/', verifyToken, requirePermission('seasons', 'create'), seasonController.createSeason);
router.get('/', verifyToken, requirePermission('seasons', 'view'), seasonController.getAllSeasons);
router.put('/:id/status', verifyToken, requirePermission('seasons', 'edit'), seasonController.updateSeasonStatus);

module.exports = router;
