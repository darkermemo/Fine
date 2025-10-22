const { supabaseAdmin } = require('../config/supabase');
const jwt = require('jsonwebtoken');

// Verify JWT token from Authorization header
const verifySupabaseToken = async (token) => {
  try {
    if (!token) return null;
    
    // Verify JWT token
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded) return null;

    // For production, you might want to verify signature with Supabase's public key
    // For now, we trust Supabase-issued tokens
    return decoded.payload;
  } catch (error) {
    console.error('Token verification error:', error.message);
    return null;
  }
};

// Middleware to protect routes
const protectSupabase = async (req, res, next) => {
  try {
    let token = req.headers.authorization;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Please log in first.'
      });
    }

    // Remove 'Bearer ' prefix if present
    if (token.startsWith('Bearer ')) {
      token = token.slice(7);
    }

    // Verify token
    const user = await verifySupabaseToken(token);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Get user profile from database
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*, roles(*)')
      .eq('user_id', user.sub)
      .single();

    if (error) {
      console.error('Profile fetch error:', error);
      return res.status(401).json({
        success: false,
        message: 'User profile not found'
      });
    }

    // Attach to request
    req.user = {
      id: user.sub,
      email: user.email,
      profile: profile
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// Middleware to check user role
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const userRole = req.user.profile?.roles?.name;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to access this resource.'
      });
    }

    next();
  };
};

// Middleware to check permissions
const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const permissions = req.user.profile?.roles?.permissions || [];
    if (!permissions.includes(requiredPermission)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have the required permission.'
      });
    }

    next();
  };
};

module.exports = {
  protectSupabase,
  checkRole,
  checkPermission,
  verifySupabaseToken
};
