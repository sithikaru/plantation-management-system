const PlantLot = require('../models/PlantLot');
const PlantSpecies = require('../models/PlantSpecies');

// @desc    Create new plant lot
// @route   POST /api/lots
// @access  Private
const createLot = async (req, res) => {
  try {
    const {
      lotId,
      speciesId,
      plantedDate,
      zone,
      locationId,
      currentHeight,
      diameter,
      healthStatus,
      photos,
      notes
    } = req.body;

    // Verify that the species exists
    const species = await PlantSpecies.findById(speciesId);
    if (!species) {
      return res.status(404).json({
        success: false,
        message: 'Plant species not found'
      });
    }

    // Check if lot ID already exists
    const existingLot = await PlantLot.findOne({ lotId });
    if (existingLot) {
      return res.status(400).json({
        success: false,
        message: 'Lot ID already exists'
      });
    }

    const lot = await PlantLot.create({
      lotId,
      speciesId,
      plantedDate,
      zone,
      locationId,
      currentHeight,
      diameter,
      healthStatus,
      photos,
      notes,
      createdBy: req.user.id
    });

    // Populate species information
    await lot.populate('speciesId', 'name code category');
    await lot.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      data: lot
    });
  } catch (error) {
    console.error('Error creating plant lot:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error creating plant lot'
    });
  }
};

// @desc    Get all plant lots
// @route   GET /api/lots
// @access  Private
const getAllLots = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      zone,
      healthStatus,
      speciesId,
      sortBy = 'plantedDate',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (zone) filter.zone = zone;
    if (healthStatus) filter.healthStatus = healthStatus;
    if (speciesId) filter.speciesId = speciesId;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const lots = await PlantLot.find(filter)
      .populate('speciesId', 'name code category minHeight harvestDays')
      .populate('createdBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await PlantLot.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: lots,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching plant lots:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching plant lots'
    });
  }
};

// @desc    Get single plant lot by ID
// @route   GET /api/lots/:id
// @access  Private
const getLotById = async (req, res) => {
  try {
    const lot = await PlantLot.findById(req.params.id)
      .populate('speciesId', 'name code category minHeight harvestDays growthStages')
      .populate('createdBy', 'name email role');

    if (!lot) {
      return res.status(404).json({
        success: false,
        message: 'Plant lot not found'
      });
    }

    res.status(200).json({
      success: true,
      data: lot
    });
  } catch (error) {
    console.error('Error fetching plant lot:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching plant lot'
    });
  }
};

// @desc    Update plant lot growth and health
// @route   PUT /api/lots/:id
// @access  Private
const updateLot = async (req, res) => {
  try {
    const {
      currentHeight,
      diameter,
      healthStatus,
      photos,
      notes,
      zone,
      locationId
    } = req.body;

    const lot = await PlantLot.findById(req.params.id);

    if (!lot) {
      return res.status(404).json({
        success: false,
        message: 'Plant lot not found'
      });
    }

    // Update fields if provided
    if (currentHeight !== undefined) {
      lot.growthHistory.push({
        height: currentHeight,
        diameter: diameter || lot.diameter,
        recordedAt: new Date(),
        recordedBy: req.user.id
      });
      lot.currentHeight = currentHeight;
    }

    if (diameter !== undefined) lot.diameter = diameter;
    if (healthStatus) lot.healthStatus = healthStatus;
    if (photos) lot.photos = [...lot.photos, ...photos];
    if (notes) lot.notes = notes;
    if (zone) lot.zone = zone;
    if (locationId) lot.locationId = locationId;

    lot.updatedBy = req.user.id;
    lot.updatedAt = new Date();

    await lot.save();

    // Populate species information
    await lot.populate('speciesId', 'name code category minHeight harvestDays');
    await lot.populate('createdBy', 'name email');
    await lot.populate('updatedBy', 'name email');

    res.status(200).json({
      success: true,
      data: lot
    });
  } catch (error) {
    console.error('Error updating plant lot:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error updating plant lot'
    });
  }
};

// @desc    Delete plant lot
// @route   DELETE /api/lots/:id
// @access  Private (Manager only)
const deleteLot = async (req, res) => {
  try {
    const lot = await PlantLot.findById(req.params.id);

    if (!lot) {
      return res.status(404).json({
        success: false,
        message: 'Plant lot not found'
      });
    }

    // Only managers can delete lots
    if (req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only managers can delete plant lots'
      });
    }

    await PlantLot.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Plant lot deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting plant lot:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting plant lot'
    });
  }
};

// @desc    Get lot statistics
// @route   GET /api/lots/stats
// @access  Private
const getLotStats = async (req, res) => {
  try {
    const stats = await PlantLot.aggregate([
      {
        $group: {
          _id: null,
          totalLots: { $sum: 1 },
          healthyLots: {
            $sum: {
              $cond: [{ $eq: ['$healthStatus', 'healthy'] }, 1, 0]
            }
          },
          sickLots: {
            $sum: {
              $cond: [{ $eq: ['$healthStatus', 'sick'] }, 1, 0]
            }
          },
          avgHeight: { $avg: '$currentHeight' },
          avgDiameter: { $avg: '$diameter' }
        }
      }
    ]);

    const zoneStats = await PlantLot.aggregate([
      {
        $group: {
          _id: '$zone',
          count: { $sum: 1 },
          avgHeight: { $avg: '$currentHeight' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: stats[0] || {
          totalLots: 0,
          healthyLots: 0,
          sickLots: 0,
          avgHeight: 0,
          avgDiameter: 0
        },
        zoneStats
      }
    });
  } catch (error) {
    console.error('Error fetching lot statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching lot statistics'
    });
  }
};

module.exports = {
  createLot,
  getAllLots,
  getLotById,
  updateLot,
  deleteLot,
  getLotStats
};
