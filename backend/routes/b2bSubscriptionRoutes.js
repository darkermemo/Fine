const express = require('express');
const router = express.Router();
const { protectSupabase, checkRole } = require('../middleware/supabase-auth');
const {
  getPlans,
  createBusinessAccount,
  getBusinessAccount,
  updateBusinessAccount,
  addEmployee,
  getEmployees,
  updateEmployee,
  submitFineForBusiness,
  getBillingHistory,
  createMonthlyInvoice,
  getBusinessAnalytics
} = require('../controllers/b2bSubscriptionController');

// ═══════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION PLANS (Public)
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/plans', getPlans);

// ═══════════════════════════════════════════════════════════════════════════════
// BUSINESS ACCOUNT MANAGEMENT (Protected)
// ═══════════════════════════════════════════════════════════════════════════════

router.post('/accounts', protectSupabase, createBusinessAccount);
router.get('/accounts/:businessId', protectSupabase, getBusinessAccount);
router.put('/accounts/:businessId', protectSupabase, updateBusinessAccount);

// ═══════════════════════════════════════════════════════════════════════════════
// EMPLOYEE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

router.post('/accounts/:businessId/employees', protectSupabase, addEmployee);
router.get('/accounts/:businessId/employees', protectSupabase, getEmployees);
router.put('/accounts/:businessId/employees/:employeeId', protectSupabase, updateEmployee);

// ═══════════════════════════════════════════════════════════════════════════════
// FINE SUBMISSION FOR BUSINESSES
// ═══════════════════════════════════════════════════════════════════════════════

router.post('/accounts/:businessId/submit-fine', protectSupabase, submitFineForBusiness);

// ═══════════════════════════════════════════════════════════════════════════════
// BILLING & INVOICES
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/accounts/:businessId/billing', protectSupabase, getBillingHistory);
router.post('/accounts/:businessId/invoice', protectSupabase, checkRole('admin'), createMonthlyInvoice);

// ═══════════════════════════════════════════════════════════════════════════════
// ANALYTICS & REPORTING
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/accounts/:businessId/analytics', protectSupabase, getBusinessAnalytics);

module.exports = router;
