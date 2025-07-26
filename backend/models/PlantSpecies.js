const mongoose = require('mongoose');

const plantSpeciesSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Species name is required'],
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
    match: [/^[A-Z0-9]+$/, 'Species code must contain only uppercase letters and numbers']
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
      validator: Number.isInteger,
      message: 'Harvest days must be a whole number'
    }
  },
  description: {
    type: String,
    trim: true,
    maxLength: [500, 'Description cannot exceed 500 characters']
  },
  scientificName: {
    type: String,
    trim: true,
    maxLength: [150, 'Scientific name cannot exceed 150 characters']
  },
  category: {
    type: String,
    enum: {
      values: ['fruit', 'vegetable', 'herb', 'grain', 'tree', 'flower', 'other'],
      message: 'Category must be one of: fruit, vegetable, herb, grain, tree, flower, other'
    },
    default: 'other'
  },
  growthStages: [{
    stage: {
      type: String,
      required: true,
      enum: ['seedling', 'vegetative', 'flowering', 'fruiting', 'mature']
    },
    daysFromPlanting: {
      type: Number,
      required: true,
      min: 0
    },
    description: {
      type: String,
      maxLength: [200, 'Stage description cannot exceed 200 characters']
    }
  }],
  optimalConditions: {
    temperature: {
      min: {
        type: Number,
        validate: {
          validator: function(value) {
            return value <= this.optimalConditions.temperature.max;
          },
          message: 'Minimum temperature cannot be greater than maximum temperature'
        }
      },
      max: {
        type: Number,
        validate: {
          validator: function(value) {
            return value >= this.optimalConditions.temperature.min;
          },
          message: 'Maximum temperature cannot be less than minimum temperature'
        }
      },
      unit: {
        type: String,
        enum: ['celsius', 'fahrenheit'],
        default: 'celsius'
      }
    },
    humidity: {
      min: {
        type: Number,
        min: [0, 'Humidity cannot be negative'],
        max: [100, 'Humidity cannot exceed 100%']
      },
      max: {
        type: Number,
        min: [0, 'Humidity cannot be negative'],
        max: [100, 'Humidity cannot exceed 100%']
      }
    },
    soilPH: {
      min: {
        type: Number,
        min: [0, 'pH cannot be negative'],
        max: [14, 'pH cannot exceed 14']
      },
      max: {
        type: Number,
        min: [0, 'pH cannot be negative'],
        max: [14, 'pH cannot exceed 14']
      }
    }
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
plantSpeciesSchema.index({ name: 1 });
plantSpeciesSchema.index({ code: 1 });
plantSpeciesSchema.index({ category: 1 });
plantSpeciesSchema.index({ isActive: 1 });

// Update the updatedAt field before saving
plantSpeciesSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to get harvest ready date from planting date
plantSpeciesSchema.methods.getHarvestDate = function(plantingDate) {
  const harvestDate = new Date(plantingDate);
  harvestDate.setDate(harvestDate.getDate() + this.harvestDays);
  return harvestDate;
};

// Instance method to check if plant is ready for harvest
plantSpeciesSchema.methods.isReadyForHarvest = function(plantingDate, currentHeight) {
  const daysFromPlanting = Math.floor((Date.now() - new Date(plantingDate)) / (1000 * 60 * 60 * 24));
  return daysFromPlanting >= this.harvestDays && currentHeight >= this.minHeight;
};

// Static method to find species by category
plantSpeciesSchema.statics.findByCategory = function(category) {
  return this.find({ category, isActive: true });
};

// Static method to find species by code
plantSpeciesSchema.statics.findByCode = function(code) {
  return this.findOne({ code: code.toUpperCase(), isActive: true });
};

// Virtual for total plant lots
plantSpeciesSchema.virtual('totalLots', {
  ref: 'PlantLot',
  localField: '_id',
  foreignField: 'speciesId',
  count: true
});

// Ensure virtual fields are serialized
plantSpeciesSchema.set('toJSON', { virtuals: true });

const PlantSpecies = mongoose.model('PlantSpecies', plantSpeciesSchema);

module.exports = PlantSpecies;
