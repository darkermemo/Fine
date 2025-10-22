const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  updateProfile
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { uploadProfile, handleUploadError } = require('../middleware/upload');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.put('/profile', protect, uploadProfile, handleUploadError, updateProfile);

module.exports = router;
