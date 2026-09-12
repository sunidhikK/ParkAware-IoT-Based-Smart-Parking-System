const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const slotController = require('../controllers/slotController');

router.get('/', authenticateToken, slotController.getSlots);
router.get('/:id', authenticateToken, slotController.getSlot);
router.post('/:id/reserve', authenticateToken, slotController.reserveSlot);
router.post('/:id/checkin', authenticateToken, slotController.checkinSlot);
router.post('/:id/park', authenticateToken, slotController.parkNow);

module.exports = router;
