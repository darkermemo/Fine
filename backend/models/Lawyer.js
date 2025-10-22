const mongoose = require('mongoose');

const lawyerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true
  },
  barAssociation: {
    type: String,
    required: true
  },
  yearsOfExperience: {
    type: Number,
    required: true
  },
  specializations: [{
    type: String,
    enum: ['speeding', 'reckless_driving', 'dui', 'traffic_misdemeanor', 'cdl_violations', 'red_light', 'stop_sign', 'other']
  }],
  jurisdictions: [{
    state: String,
    counties: [String],
    courts: [String]
  }],
  bio: {
    type: String,
    maxlength: 1000
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  statistics: {
    totalCases: {
      type: Number,
      default: 0
    },
    casesWon: {
      type: Number,
      default: 0
    },
    casesDismissed: {
      type: Number,
      default: 0
    },
    casesReduced: {
      type: Number,
      default: 0
    },
    successRate: {
      type: Number,
      default: 0
    }
  },
  availability: {
    isAvailable: {
      type: Boolean,
      default: true
    },
    maxCases: {
      type: Number,
      default: 20
    },
    currentCases: {
      type: Number,
      default: 0
    }
  },
  pricing: {
    baseFee: {
      type: Number,
      default: 249
    },
    dui: Number,
    misdemeanor: Number,
    cdl: Number
  },
  bankDetails: {
    accountNumber: String,
    routingNumber: String,
    accountHolderName: String
  },
  documents: [{
    type: {
      type: String,
      enum: ['license', 'insurance', 'certification', 'other']
    },
    url: String,
    uploadedAt: Date
  }],
  isApproved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  rejectionReason: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Calculate success rate
lawyerSchema.methods.calculateSuccessRate = function() {
  if (this.statistics.totalCases === 0) return 0;
  
  const successfulCases = this.statistics.casesWon + 
                          this.statistics.casesDismissed + 
                          this.statistics.casesReduced;
  
  this.statistics.successRate = Math.round((successfulCases / this.statistics.totalCases) * 100);
  return this.statistics.successRate;
};

// Update rating
lawyerSchema.methods.updateRating = function(newRating) {
  const totalRating = (this.rating.average * this.rating.count) + newRating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
  return this.save();
};

module.exports = mongoose.model('Lawyer', lawyerSchema);
