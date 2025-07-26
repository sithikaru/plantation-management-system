const mongoose = require('mongoose');

const plantLotSchema = new mongoose.Schema({
  lotId: {
    type: String,
    required: [true, 'Lot ID is required'],
    trim: true,
    uppercase: true,
    maxLength: [20, 'Lot ID cannot exceed 20 characters'],
    unique: true,
    match: [/^[A-Z0-9_-]+$/, 'Lot ID can only contain uppercase letters, numbers, hyphens, and underscores']
  },
  speciesId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PlantSpecies',
    required: [true, 'Species ID is required']
  },
  plantedDate: {
    type: Date,
    required: [true, 'Planted date is required'],
    validate: {
      validator: function(value) {
        return value <= Date.now();
      },
      message: 'Planted date cannot be in the future'
    }
  },
  zone: {
    type: String,
    required: [true, 'Zone is required'],
    trim: true,
    maxLength: [50, 'Zone cannot exceed 50 characters']
  },
  locationId: {
    type: String,
    required: [true, 'Location ID is required'],
    trim: true,
    maxLength: [50, 'Location ID cannot exceed 50 characters']
  },
  currentHeight: {
    type: Number,
    required: [true, 'Current height is required'],
    min: [0, 'Current height cannot be negative'],
    validate: {
      validator: function(value) {
        return value >= 0;
      },
      message: 'Current height must be a positive number'
    }
  },
  diameter: {
    type: Number,
    required: [true, 'Diameter is required'],
    min: [0, 'Diameter cannot be negative'],
    validate: {
      validator: function(value) {
        return value >= 0;
      },
      message: 'Diameter must be a positive number'
    }
  },
  healthStatus: {
    type: String,
    required: [true, 'Health status is required'],
    enum: {
      values: ['excellent', 'good', 'fair', 'poor', 'critical', 'dead'],
      message: 'Health status must be one of: excellent, good, fair, poor, critical, dead'
    },
    default: 'good'
  },
  photos: [{
    url: {
      type: String,
      required: [true, 'Photo URL is required'],
      validate: {
        validator: function(value) {
          return /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(value);
        },
        message: 'Photo URL must be a valid image URL (jpg, jpeg, png, webp, gif)'
      }
    },
    caption: {
      type: String,
      trim: true,
      maxLength: [200, 'Photo caption cannot exceed 200 characters']
    },
    takenDate: {
      type: Date,
      default: Date.now
    },
    takenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  plantCount: {
    type: Number,
    required: [true, 'Plant count is required'],
    min: [1, 'Plant count must be at least 1'],
    validate: {
      validator: function(value) {
        return Number.isInteger(value) && value > 0;
      },
      message: 'Plant count must be a positive integer'
    }
  },
  soilCondition: {
    pH: {
      type: Number,
      min: [0, 'pH cannot be less than 0'],
      max: [14, 'pH cannot be greater than 14']
    },
    moisture: {
      type: String,
      enum: {
        values: ['dry', 'moist', 'wet', 'waterlogged'],
        message: 'Moisture level must be dry, moist, wet, or waterlogged'
      }
    },
    nutrients: {
      nitrogen: { type: Number, min: 0 },
      phosphorus: { type: Number, min: 0 },
      potassium: { type: Number, min: 0 }
    }
  },
  lastWatered: {
    type: Date
  },
  lastFertilized: {
    type: Date
  },
  lastPruned: {
    type: Date
  },
  expectedHarvestDate: {
    type: Date
  },
  actualHarvestDate: {
    type: Date
  },
  harvestYield: {
    type: Number,
    min: [0, 'Harvest yield cannot be negative']
  },
  notes: {
    type: String,
    trim: true,
    maxLength: [1000, 'Notes cannot exceed 1000 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by user is required']
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
plantLotSchema.index({ lotId: 1 });
plantLotSchema.index({ speciesId: 1 });
plantLotSchema.index({ zone: 1 });
plantLotSchema.index({ locationId: 1 });
plantLotSchema.index({ healthStatus: 1 });
plantLotSchema.index({ plantedDate: 1 });
plantLotSchema.index({ expectedHarvestDate: 1 });
plantLotSchema.index({ isActive: 1 });
plantLotSchema.index({ assignedTo: 1 });

// Compound indexes
plantLotSchema.index({ zone: 1, locationId: 1 });
plantLotSchema.index({ speciesId: 1, healthStatus: 1 });
plantLotSchema.index({ plantedDate: 1, expectedHarvestDate: 1 });

// Pre-save middleware to update timestamps and calculate expected harvest date
plantLotSchema.pre('save', async function(next) {
  this.updatedAt = Date.now();
  
  // Calculate expected harvest date if species is populated
  if (this.isModified('speciesId') || this.isModified('plantedDate')) {
    try {
      const PlantSpecies = mongoose.model('PlantSpecies');
      const species = await PlantSpecies.findById(this.speciesId);
      if (species) {
        const expectedDate = new Date(this.plantedDate);
        expectedDate.setDate(expectedDate.getDate() + species.harvestDays);
        this.expectedHarvestDate = expectedDate;
      }
    } catch (error) {
      // Continue without setting expected harvest date if species lookup fails
    }
  }
  
  next();
});

// Instance method to calculate days since planted
plantLotSchema.methods.getDaysSincePlanted = function() {
  return Math.floor((Date.now() - this.plantedDate) / (1000 * 60 * 60 * 24));
};

// Instance method to calculate days until harvest
plantLotSchema.methods.getDaysUntilHarvest = function() {
  if (!this.expectedHarvestDate) return null;
  return Math.ceil((this.expectedHarvestDate - Date.now()) / (1000 * 60 * 60 * 24));
};

// Instance method to check if ready for harvest
plantLotSchema.methods.isReadyForHarvest = function() {
  return this.expectedHarvestDate && Date.now() >= this.expectedHarvestDate;
};

// Instance method to get growth percentage (based on species min height)
plantLotSchema.methods.getGrowthPercentage = async function() {
  const PlantSpecies = mongoose.model('PlantSpecies');
  const species = await PlantSpecies.findById(this.speciesId);
  if (!species || !species.minHeight) return null;
  
  return Math.min(100, (this.currentHeight / species.minHeight) * 100);
};

// Instance method to add photo
plantLotSchema.methods.addPhoto = function(photoData, userId) {
  this.photos.push({
    ...photoData,
    takenBy: userId,
    takenDate: new Date()
  });
  return this.save();
};

// Instance method to update health status with notes
plantLotSchema.methods.updateHealthStatus = function(status, notes, userId) {
  this.healthStatus = status;
  if (notes) {
    this.notes = this.notes ? `${this.notes}\n[${new Date().toISOString()}] ${notes}` : notes;
  }
  this.updatedBy = userId;
  return this.save();
};

// Static method to find lots by health status
plantLotSchema.statics.findByHealthStatus = function(status) {
  return this.find({ healthStatus: status, isActive: true }).populate('speciesId assignedTo');
};

// Static method to find lots ready for harvest
plantLotSchema.statics.findReadyForHarvest = function() {
  return this.find({
    expectedHarvestDate: { $lte: new Date() },
    actualHarvestDate: { $exists: false },
    isActive: true
  }).populate('speciesId assignedTo');
};

// Static method to find lots by zone
plantLotSchema.statics.findByZone = function(zone) {
  return this.find({ zone, isActive: true }).populate('speciesId assignedTo');
};

// Static method to find lots by assigned user
plantLotSchema.statics.findByAssignedUser = function(userId) {
  return this.find({ assignedTo: userId, isActive: true }).populate('speciesId');
};

// Virtual for lot age in days
plantLotSchema.virtual('ageInDays').get(function() {
  return this.getDaysSincePlanted();
});

// Virtual for harvest status
plantLotSchema.virtual('harvestStatus').get(function() {
  if (this.actualHarvestDate) return 'harvested';
  if (this.isReadyForHarvest()) return 'ready';
  return 'growing';
});

// Virtual for full location identifier
plantLotSchema.virtual('fullLocation').get(function() {
  return `${this.zone} - ${this.locationId}`;
});

// Ensure virtual fields are serialized
plantLotSchema.set('toJSON', { virtuals: true });

const PlantLot = mongoose.model('PlantLot', plantLotSchema);

module.exports = PlantLot;
