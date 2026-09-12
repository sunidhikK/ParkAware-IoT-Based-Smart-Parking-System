const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const parkingController = require('../controllers/parkingController');

router.post('/:id/exit', authenticateToken, parkingController.exitParking);
router.get('/my-history', authenticateToken, parkingController.getMyHistory);
router.get('/active-session', authenticateToken, parkingController.getActiveSession);
router.get('/receipt/:id', authenticateToken, parkingController.getReceipt);

module.exports = router;
