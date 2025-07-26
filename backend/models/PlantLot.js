const mongoose = require('mongoose');

const plantLotSchema = new mongoose.Schema({
  lotId: {
    type: String,
    required: [true, 'Lot ID is required'],
    unique: true,
    trim: true,
    uppercase: true,
    maxLength: [20, 'Lot ID cannot exceed 20 characters'],
    match: [/^[A-Z0-9-]+$/, 'Lot ID must contain only uppercase letters, numbers, and hyphens']
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
        return value <= new Date();
      },
      message: 'Planted date cannot be in the future'
    }
  },
  zone: {
    type: String,
    required: [true, 'Zone is required'],
    trim: true,
    maxLength: [50, 'Zone name cannot exceed 50 characters']
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
    min: [0, 'Diameter cannot be negative'],
    validate: {
      validator: function(value) {
        return value == null || value >= 0;
      },
      message: 'Diameter must be a positive number'
    }
  },
  healthStatus: {
    type: String,
    required: [true, 'Health status is required'],
    enum: {
      values: ['excellent', 'good', 'fair', 'poor', 'diseased', 'dead'],
      message: 'Health status must be one of: excellent, good, fair, poor, diseased, dead'
    },
    default: 'good'
  },
  photos: [{
    url: {
      type: String,
      required: true,
      trim: true
    },
    caption: {
      type: String,
      trim: true,
      maxLength: [200, 'Photo caption cannot exceed 200 characters']
    },
    takenAt: {
      type: Date,
      default: Date.now
    },
    takenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  growthMeasurements: [{
    height: {
      type: Number,
      required: true,
      min: 0
    },
    diameter: {
      type: Number,
      min: 0
    },
    measuredAt: {
      type: Date,
      default: Date.now
    },
    measuredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    notes: {
      type: String,
      trim: true,
      maxLength: [300, 'Measurement notes cannot exceed 300 characters']
    }
  }],
  healthRecords: [{
    status: {
      type: String,
      required: true,
      enum: ['excellent', 'good', 'fair', 'poor', 'diseased', 'dead']
    },
    symptoms: [{
      type: String,
      trim: true
    }],
    treatment: {
      type: String,
      trim: true,
      maxLength: [500, 'Treatment description cannot exceed 500 characters']
    },
    recordedAt: {
      type: Date,
      default: Date.now
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    notes: {
      type: String,
      trim: true,
      maxLength: [500, 'Health record notes cannot exceed 500 characters']
    }
  }],
  coordinates: {
    latitude: {
      type: Number,
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    longitude: {
      type: Number,
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    }
  },
  harvestInfo: {
    isHarvested: {
      type: Boolean,
      default: false
    },
    harvestedDate: {
      type: Date,
      validate: {
        validator: function(value) {
          return !value || value >= this.plantedDate;
        },
        message: 'Harvest date cannot be before planted date'
      }
    },
    harvestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    yield: {
      quantity: {
        type: Number,
        min: 0
      },
      unit: {
        type: String,
        enum: ['kg', 'g', 'tons', 'pieces', 'bunches', 'liters'],
        default: 'kg'
      }
    },
    quality: {
      type: String,
      enum: ['premium', 'standard', 'below-standard', 'rejected']
    }
  },
  assignedWorker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by user ID is required']
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
plantLotSchema.index({ 'harvestInfo.isHarvested': 1 });
plantLotSchema.index({ isActive: 1 });
plantLotSchema.index({ assignedWorker: 1 });

// Compound indexes
plantLotSchema.index({ zone: 1, locationId: 1 });
plantLotSchema.index({ speciesId: 1, healthStatus: 1 });

// Update the updatedAt field before saving
plantLotSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to calculate days since planting
plantLotSchema.methods.getDaysFromPlanting = function() {
  const now = new Date();
  const plantedDate = new Date(this.plantedDate);
  return Math.floor((now - plantedDate) / (1000 * 60 * 60 * 24));
};

// Instance method to add growth measurement
plantLotSchema.methods.addGrowthMeasurement = function(height, diameter, measuredBy, notes) {
  this.growthMeasurements.push({
    height,
    diameter,
    measuredBy,
    notes,
    measuredAt: new Date()
  });
  
  // Update current height and diameter
  this.currentHeight = height;
  if (diameter !== undefined) {
    this.diameter = diameter;
  }
  
  return this.save();
};

// Instance method to add health record
plantLotSchema.methods.addHealthRecord = function(status, symptoms, treatment, recordedBy, notes) {
  this.healthRecords.push({
    status,
    symptoms,
    treatment,
    recordedBy,
    notes,
    recordedAt: new Date()
  });
  
  // Update current health status
  this.healthStatus = status;
  
  return this.save();
};

// Instance method to add photo
plantLotSchema.methods.addPhoto = function(url, caption, takenBy) {
  this.photos.push({
    url,
    caption,
    takenBy,
    takenAt: new Date()
  });
  
  return this.save();
};

// Instance method to check if ready for harvest (requires populated species)
plantLotSchema.methods.isReadyForHarvest = function() {
  if (!this.speciesId || !this.speciesId.harvestDays || !this.speciesId.minHeight) {
    throw new Error('Species information is required. Please populate speciesId.');
  }
  
  const daysFromPlanting = this.getDaysFromPlanting();
  return daysFromPlanting >= this.speciesId.harvestDays && this.currentHeight >= this.speciesId.minHeight;
};

// Instance method to harvest the plant
plantLotSchema.methods.harvest = function(harvestedBy, quantity, unit, quality) {
  this.harvestInfo = {
    isHarvested: true,
    harvestedDate: new Date(),
    harvestedBy,
    yield: {
      quantity,
      unit: unit || 'kg'
    },
    quality
  };
  
  return this.save();
};

// Static method to find lots by zone
plantLotSchema.statics.findByZone = function(zone) {
  return this.find({ zone, isActive: true });
};

// Static method to find lots by health status
plantLotSchema.statics.findByHealthStatus = function(status) {
  return this.find({ healthStatus: status, isActive: true });
};

// Static method to find unharvested lots
plantLotSchema.statics.findUnharvested = function() {
  return this.find({ 'harvestInfo.isHarvested': false, isActive: true });
};

// Static method to find lots ready for harvest
plantLotSchema.statics.findReadyForHarvest = function() {
  return this.find({ isActive: true })
    .populate('speciesId', 'harvestDays minHeight')
    .then(lots => {
      return lots.filter(lot => {
        try {
          return lot.isReadyForHarvest();
        } catch (error) {
          return false;
        }
      });
    });
};

// Virtual for growth rate (height per day)
plantLotSchema.virtual('growthRate').get(function() {
  const daysFromPlanting = this.getDaysFromPlanting();
  return daysFromPlanting > 0 ? (this.currentHeight / daysFromPlanting) : 0;
});

// Virtual for latest photo
plantLotSchema.virtual('latestPhoto').get(function() {
  return this.photos.length > 0 ? this.photos[this.photos.length - 1] : null;
});

// Virtual for latest health record
plantLotSchema.virtual('latestHealthRecord').get(function() {
  return this.healthRecords.length > 0 ? this.healthRecords[this.healthRecords.length - 1] : null;
});

// Ensure virtual fields are serialized
plantLotSchema.set('toJSON', { virtuals: true });

const PlantLot = mongoose.model('PlantLot', plantLotSchema);

module.exports = PlantLot;
