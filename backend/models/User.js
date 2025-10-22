const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'lawyer', 'admin'],
    default: 'user'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  profileImage: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'premium', 'business'],
      default: 'free'
    },
    startDate: Date,
    endDate: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  },
  quota: {
    casesPerMonth: {
      type: Number,
      default: 5
    },
    casesUsed: {
      type: Number,
      default: 0
    },
    resetDate: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: Date
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Reset monthly quota
userSchema.methods.resetMonthlyQuota = function() {
  const now = new Date();
  const resetDate = this.quota.resetDate || now;
  
  if (now >= resetDate) {
    this.quota.casesUsed = 0;
    this.quota.resetDate = new Date(now.setMonth(now.getMonth() + 1));
    return this.save();
  }
};

module.exports = mongoose.model('User', userSchema);
