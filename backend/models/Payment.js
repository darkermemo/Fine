const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
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
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'usd'
  },
  type: {
    type: String,
    enum: ['case_payment', 'subscription', 'refund'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: {
      type: String,
      enum: ['card', 'bank', 'paypal']
    },
    last4: String,
    brand: String
  },
  stripePaymentIntentId: String,
  stripeChargeId: String,
  stripeRefundId: String,
  transactionId: {
    type: String,
    unique: true
  },
  metadata: {
    ip: String,
    userAgent: String,
    description: String
  },
  refund: {
    amount: Number,
    reason: String,
    requestedAt: Date,
    processedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed']
    }
  },
  lawyerPayout: {
    amount: Number,
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed']
    },
    paidAt: Date,
    transactionId: String
  },
  platformFee: {
    amount: Number,
    percentage: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate unique transaction ID
paymentSchema.pre('save', async function(next) {
  if (!this.transactionId) {
    this.transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
