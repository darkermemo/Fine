const express = require('express');
const router = express.Router();
const {
  registerLawyer,
  getLawyerProfile,
  updateLawyerProfile,
  getLawyerStatistics,
  toggleAvailability,
  getPublicLawyerProfile,
  searchLawyers
} = require('../controllers/lawyerController');
const { protect, authorize } = require('../middleware/auth');
const { uploadMultiple, handleUploadError } = require('../middleware/upload');

// Public routes
router.get('/search', searchLawyers);
router.get('/:id', getPublicLawyerProfile);

// Protected routes
router.post('/register', protect, uploadMultiple, handleUploadError, registerLawyer);
router.get('/profile/me', protect, authorize('lawyer', 'admin'), getLawyerProfile);
router.put('/profile/me', protect, authorize('lawyer'), updateLawyerProfile);
router.get('/statistics/me', protect, authorize('lawyer'), getLawyerStatistics);
router.put('/availability', protect, authorize('lawyer'), toggleAvailability);

module.exports = router;
