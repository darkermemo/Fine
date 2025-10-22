const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Get user from token
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
      error: error.message
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Check quota
exports.checkQuota = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    // Reset quota if needed
    await user.resetMonthlyQuota();

    // Check if user has exceeded quota
    if (user.quota.casesUsed >= user.quota.casesPerMonth) {
      return res.status(403).json({
        success: false,
        message: 'Monthly case quota exceeded. Please upgrade your plan.',
        quota: {
          limit: user.quota.casesPerMonth,
          used: user.quota.casesUsed,
          resetDate: user.quota.resetDate
        }
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error checking quota',
      error: error.message
    });
  }
};
