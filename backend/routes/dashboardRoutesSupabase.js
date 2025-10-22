const express = require('express');
const router = express.Router();
const {
  getUserDashboard,
  getLawyerDashboard,
  getAdminDashboard,
  getAnalytics
} = require('../controllers/dashboardControllerSupabase');
const { protectSupabase, checkRole } = require('../middleware/supabase-auth');

// User dashboard
router.get('/user', protectSupabase, getUserDashboard);

// Lawyer dashboard
router.get('/lawyer', protectSupabase, getLawyerDashboard);

// Admin dashboard
router.get('/admin', protectSupabase, checkRole(['admin']), getAdminDashboard);

// Analytics (admin/business_support)
router.get('/analytics', protectSupabase, getAnalytics);

module.exports = router;
