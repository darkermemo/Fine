const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
  caseNumber: {
    type: String,
    unique: true,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lawyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lawyer'
  },
  ticketDetails: {
    violationType: {
      type: String,
      required: true,
      enum: ['speeding', 'red_light', 'stop_sign', 'cell_phone', 'hov', 'reckless_driving', 
             'suspended_license', 'dui', 'lane_change', 'no_insurance', 'racing', 
             'construction_zone', 'other']
    },
    ticketNumber: String,
    issueDate: {
      type: Date,
      required: true
    },
    location: {
      street: String,
      city: String,
      state: {
        type: String,
        required: true
      },
      county: String
    },
    court: {
      name: {
        type: String,
        required: true
      },
      address: String,
      phone: String
    },
    officerInfo: {
      name: String,
      badgeNumber: String
    },
    speedDetails: {
      actualSpeed: Number,
      speedLimit: Number,
      zone: String
    },
    fine: {
      type: Number,
      required: true
    },
    points: Number,
    ticketImage: {
      type: String,
      required: true
    }
  },
  clientInfo: {
    isCDLDriver: {
      type: Boolean,
      default: false
    },
    licenseNumber: String,
    licenseState: String
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in_progress', 'court_scheduled', 'dismissed', 
           'reduced', 'lost', 'closed'],
    default: 'pending'
  },
  timeline: [{
    status: String,
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  courtDate: Date,
  outcome: {
    type: {
      type: String,
      enum: ['dismissed', 'reduced', 'guilty', 'pending']
    },
    finalFine: Number,
    finalPoints: Number,
    notes: String,
    documentUrl: String
  },
  pricing: {
    quotedPrice: {
      type: Number,
      required: true
    },
    actualPrice: Number,
    discount: Number,
    refundAmount: Number
  },
  payment: {
    status: {
      type: String,
      enum: ['pending', 'paid', 'refunded', 'failed'],
      default: 'pending'
    },
    paymentId: String,
    paidAt: Date
  },
  documents: [{
    name: String,
    type: String,
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  notes: [{
    content: String,
    isPrivate: Boolean,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  assignmentScore: Number, // Smart matching score
  clientRating: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String,
    ratedAt: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate unique case number
caseSchema.pre('save', async function(next) {
  if (!this.caseNumber) {
    const count = await mongoose.model('Case').countDocuments();
    this.caseNumber = `OTR-${Date.now()}-${count + 1}`;
  }
  next();
});

// Add timeline entry
caseSchema.methods.addTimelineEntry = function(status, note, updatedBy) {
  this.timeline.push({
    status,
    note,
    updatedBy,
    timestamp: new Date()
  });
  this.status = status;
  return this.save();
};

module.exports = mongoose.model('Case', caseSchema);
