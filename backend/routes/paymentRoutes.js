const express = require('express');
const router = express.Router();
const {
  createPaymentIntent,
  confirmPayment,
  requestRefund,
  processRefund,
  processLawyerPayout,
  getPayments,
  stripeWebhook
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

router.post('/create-intent', protect, createPaymentIntent);
router.post('/confirm', protect, confirmPayment);
router.post('/:id/refund', protect, requestRefund);
router.post('/:id/process-refund', protect, authorize('admin'), processRefund);
router.post('/:id/payout', protect, authorize('admin'), processLawyerPayout);
router.get('/', protect, getPayments);
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

module.exports = router;
