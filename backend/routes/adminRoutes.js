const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  getPendingLawyers,
  approveLawyer,
  rejectLawyer,
  updateUserQuota,
  getAllCases,
  getAllPayments,
  assignLawyerToCase,
  deleteUser
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All routes require admin authorization
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/lawyers/pending', getPendingLawyers);
router.put('/lawyers/:id/approve', approveLawyer);
router.put('/lawyers/:id/reject', rejectLawyer);
router.put('/users/:id/quota', updateUserQuota);
router.get('/cases', getAllCases);
router.get('/payments', getAllPayments);
router.put('/cases/:id/assign', assignLawyerToCase);
router.delete('/users/:id', deleteUser);

module.exports = router;
