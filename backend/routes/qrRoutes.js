const express = require('express');
const router = express.Router();
const {
  generateLotQRCode,
  generateBatchQRCodes,
  generateLotInfoQRCode,
  getQRStats
} = require('../controllers/qrController');
const { protect } = require('../middleware/auth');

// All routes are protected with JWT authentication
router.use(protect);

// @route   GET /api/qr/stats
// @desc    Get QR code statistics
// @access  Private
router.get('/stats', getQRStats);

// @route   GET /api/qr/lot/:lotId
// @desc    Generate QR code for a plant lot (detailed data)
// @access  Private
// Query params: format (base64|png), size (default: 200)
router.get('/lot/:lotId', generateLotQRCode);

// @route   GET /api/qr/lot/:lotId/info
// @desc    Generate QR code for lot information page (simple URL)
// @access  Private
// Query params: format (base64|png), size (default: 200)
router.get('/lot/:lotId/info', generateLotInfoQRCode);

// @route   POST /api/qr/lots/batch
// @desc    Generate QR codes for multiple lots
// @access  Private
// Body: { lotIds: [string], format: 'base64'|'png', size: number }
router.post('/lots/batch', generateBatchQRCodes);

module.exports = router;
