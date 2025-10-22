const express = require('express');
const router = express.Router();
const { protectSupabase } = require('../middleware/supabase-auth');
const {
  initiateCheckout,
  confirmPayment,
  getSubscriptionStatus,
  changePlan,
  cancelSubscription,
  handleStripeWebhook
} = require('../controllers/subscriptionCheckoutController');

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOMER SUBSCRIPTION CHECKOUT ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// Initiate checkout (create Stripe session)
router.post('/checkout', protectSupabase, initiateCheckout);

// Confirm payment and activate subscription
router.post('/confirm-payment', protectSupabase, confirmPayment);

// Get subscription status
router.get('/:businessId/status', protectSupabase, getSubscriptionStatus);

// Change subscription plan (upgrade/downgrade)
router.post('/:businessId/change-plan', protectSupabase, changePlan);

// Cancel subscription
router.post('/:businessId/cancel', protectSupabase, cancelSubscription);

module.exports = router;
