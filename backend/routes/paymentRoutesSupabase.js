const express = require('express');
const router = express.Router();
const {
  createPayment,
  getPayments,
  getPaymentById,
  createInvoice,
  getInvoices,
  getTransactions,
  createRefund,
  getFinancialSummary
} = require('../controllers/paymentControllerSupabase');
const { protectSupabase, checkRole, checkPermission } = require('../middleware/supabase-auth');

// Payment routes
router.post('/create', protectSupabase, createPayment);
router.get('/', protectSupabase, getPayments);
router.get('/:paymentId', protectSupabase, getPaymentById);

// Invoice routes
router.post('/invoices/create', protectSupabase, createInvoice);
router.get('/invoices', protectSupabase, getInvoices);

// Transaction routes
router.get('/transactions', protectSupabase, getTransactions);

// Refund routes
router.post('/refunds/create', protectSupabase, createRefund);

// Dashboard routes
router.get('/dashboard/financial-summary', protectSupabase, getFinancialSummary);

module.exports = router;
