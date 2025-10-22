const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  forgotPassword,
  refreshToken,
  logout
} = require('../controllers/authControllerSupabase');
const { protectSupabase } = require('../middleware/supabase-auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/refresh-token', refreshToken);

// Protected routes
router.get('/me', protectSupabase, getMe);
router.put('/profile', protectSupabase, updateProfile);
router.post('/logout', protectSupabase, logout);

module.exports = router;
