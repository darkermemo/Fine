const express = require('express');
const router = express.Router();
const { protectSupabase, checkRole } = require('../middleware/supabase-auth');
const {
  getAllPlans,
  createPlan,
  updatePlan,
  updatePlanPricing,
  updatePlanFeatures,
  deletePlan,
  getSubscriptionAnalytics,
  getPendingBillings,
  retryPayment
} = require('../controllers/adminSubscriptionController');

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN SUBSCRIPTION MANAGEMENT ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// Get all subscription plans (admin view)
router.get('/plans', protectSupabase, checkRole('admin'), getAllPlans);

// Create new subscription plan
router.post('/plans', protectSupabase, checkRole('admin'), createPlan);

// Update subscription plan (full update)
router.put('/plans/:planId', protectSupabase, checkRole('admin'), updatePlan);

// Update plan pricing (quick update: price, setup_fee, max_fines)
router.put('/plans/:planId/pricing', protectSupabase, checkRole('admin'), updatePlanPricing);

// Update plan features
router.put('/plans/:planId/features', protectSupabase, checkRole('admin'), updatePlanFeatures);

// Delete subscription plan (soft delete)
router.delete('/plans/:planId', protectSupabase, checkRole('admin'), deletePlan);

// Get subscription analytics (revenue, MRR, etc.)
router.get('/analytics', protectSupabase, checkRole('admin'), getSubscriptionAnalytics);

// Get pending billings
router.get('/pending-billings', protectSupabase, checkRole('admin'), getPendingBillings);

// Retry failed payment
router.post('/retry-payment/:invoiceId', protectSupabase, checkRole('admin'), retryPayment);

module.exports = router;
