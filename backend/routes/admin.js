const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

router.use(authenticateToken, requireAdmin);

router.get('/stats', adminController.getStats);
router.get('/logs', adminController.getLogs);
router.get('/revenue', adminController.getRevenue);
router.patch('/slots/:id', adminController.overrideSlot);
router.get('/export', adminController.exportCSV);

module.exports = router;
