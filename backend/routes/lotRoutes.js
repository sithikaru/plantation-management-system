const express = require('express');
const router = express.Router();
const {
  createLot,
  getAllLots,
  getLotById,
  updateLot,
  deleteLot,
  getLotStats
} = require('../controllers/lotController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected with JWT authentication
router.use(protect);

// @route   GET /api/lots/stats
// @desc    Get lot statistics
// @access  Private
router.get('/stats', getLotStats);

// @route   POST /api/lots
// @desc    Create new plant lot
// @access  Private
router.post('/', createLot);

// @route   GET /api/lots
// @desc    Get all plant lots with pagination and filtering
// @access  Private
router.get('/', getAllLots);

// @route   GET /api/lots/:id
// @desc    Get single plant lot by ID
// @access  Private
router.get('/:id', getLotById);

// @route   PUT /api/lots/:id
// @desc    Update plant lot growth and health
// @access  Private
router.put('/:id', updateLot);

// @route   DELETE /api/lots/:id
// @desc    Delete plant lot (Manager only)
// @access  Private
router.delete('/:id', deleteLot);

module.exports = router;
