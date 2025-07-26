const mongoose = require('mongoose');

const plantSpeciesSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Plant species name is required'],
    trim: true,
    maxLength: [100, 'Species name cannot exceed 100 characters'],
    unique: true
  },
  code: {
    type: String,
    required: [true, 'Species code is required'],
    trim: true,
    uppercase: true,
    maxLength: [10, 'Species code cannot exceed 10 characters'],
    unique: true,
    match: [/^[A-Z0-9_-]+$/, 'Species code can only contain uppercase letters, numbers, hyphens, and underscores']
  },
  minHeight: {
    type: Number,
    required: [true, 'Minimum height is required'],
    min: [0, 'Minimum height cannot be negative'],
    validate: {
      validator: function(value) {
        return value >= 0;
      },
      message: 'Minimum height must be a positive number'
    }
  },
  harvestDays: {
    type: Number,
    required: [true, 'Harvest days is required'],
    min: [1, 'Harvest days must be at least 1 day'],
    validate: {
      validator: function(value) {
        return Number.isInteger(value) && value > 0;
      },
      message: 'Harvest days must be a positive integer'
    }
  },
  description: {
    type: String,
    trim: true,
    maxLength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    trim: true,
    enum: {
      values: ['tree', 'shrub', 'herb', 'vine', 'grass', 'other'],
      message: 'Category must be one of: tree, shrub, herb, vine, grass, other'
    },
    default: 'other'
  },
  climate: {
    type: String,
    trim: true,
    enum: {
      values: ['tropical', 'subtropical', 'temperate', 'arid', 'mediterranean', 'continental'],
      message: 'Climate must be one of: tropical, subtropical, temperate, arid, mediterranean, continental'
    }
  },
  soilType: {
    type: [String],
    enum: {
      values: ['clay', 'sandy', 'loam', 'silt', 'peat', 'chalk'],
      message: 'Soil type must be one of: clay, sandy, loam, silt, peat, chalk'
    }
  },
  waterRequirement: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high'],
      message: 'Water requirement must be low, medium, or high'
    },
    default: 'medium'
  },
  sunRequirement: {
    type: String,
    enum: {
      values: ['full-sun', 'partial-sun', 'shade'],
      message: 'Sun requirement must be full-sun, partial-sun, or shade'
    },
    default: 'full-sun'
  },
  maxHeight: {
    type: Number,
    min: [0, 'Maximum height cannot be negative'],
    validate: {
      validator: function(value) {
        return !value || value >= this.minHeight;
      },
      message: 'Maximum height must be greater than or equal to minimum height'
    }
  },
  maxDiameter: {
    type: Number,
    min: [0, 'Maximum diameter cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
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
plantSpeciesSchema.index({ name: 1 });
plantSpeciesSchema.index({ code: 1 });
plantSpeciesSchema.index({ category: 1 });
plantSpeciesSchema.index({ isActive: 1 });

// Pre-save middleware to update timestamps
plantSpeciesSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to check if species is ready for harvest
plantSpeciesSchema.methods.isReadyForHarvest = function(plantedDate) {
  const daysSincePlanted = Math.floor((Date.now() - plantedDate) / (1000 * 60 * 60 * 24));
  return daysSincePlanted >= this.harvestDays;
};

// Instance method to calculate expected harvest date
plantSpeciesSchema.methods.getExpectedHarvestDate = function(plantedDate) {
  const harvestDate = new Date(plantedDate);
  harvestDate.setDate(harvestDate.getDate() + this.harvestDays);
  return harvestDate;
};

// Static method to find active species
plantSpeciesSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

// Static method to find species by category
plantSpeciesSchema.statics.findByCategory = function(category) {
  return this.find({ category, isActive: true });
};

// Virtual for full species identifier (name + code)
plantSpeciesSchema.virtual('fullIdentifier').get(function() {
  return `${this.name} (${this.code})`;
});

// Ensure virtual fields are serialized
plantSpeciesSchema.set('toJSON', { virtuals: true });

const PlantSpecies = mongoose.model('PlantSpecies', plantSpeciesSchema);

module.exports = PlantSpecies;
