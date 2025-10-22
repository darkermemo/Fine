const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy');
const Payment = require('../models/Payment');
const Case = require('../models/Case');
const Lawyer = require('../models/Lawyer');

// @desc    Create payment intent
// @route   POST /api/payments/create-intent
// @access  Private
exports.createPaymentIntent = async (req, res) => {
  try {
    const { caseId, amount } = req.body;

    // Verify case exists
    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Check if already paid
    if (caseData.payment.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Case already paid'
      });
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        caseId: caseId,
        userId: req.user.id
      }
    });

    // Create payment record
    const payment = await Payment.create({
      caseId,
      userId: req.user.id,
      lawyerId: caseData.lawyerId,
      amount,
      type: 'case_payment',
      status: 'pending',
      stripePaymentIntentId: paymentIntent.id,
      metadata: {
        ip: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    res.status(200).json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentId: payment._id
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating payment intent',
      error: error.message
    });
  }
};

// @desc    Confirm payment
// @route   POST /api/payments/confirm
// @access  Private
exports.confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, paymentId } = req.body;

    // Verify payment with Stripe
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (intent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment not successful'
      });
    }

    // Update payment record
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    payment.status = 'completed';
    payment.stripeChargeId = intent.charges.data[0].id;
    payment.paymentMethod = {
      type: 'card',
      last4: intent.charges.data[0].payment_method_details.card.last4,
      brand: intent.charges.data[0].payment_method_details.card.brand
    };

    // Calculate platform fee (20%)
    const platformFeePercent = 20;
    const platformFeeAmount = (payment.amount * platformFeePercent) / 100;
    payment.platformFee = {
      amount: platformFeeAmount,
      percentage: platformFeePercent
    };

    // Calculate lawyer payout
    payment.lawyerPayout = {
      amount: payment.amount - platformFeeAmount,
      status: 'pending'
    };

    await payment.save();

    // Update case payment status
    const caseData = await Case.findById(payment.caseId);
    caseData.payment = {
      status: 'paid',
      paymentId: payment._id,
      paidAt: new Date()
    };
    caseData.pricing.actualPrice = payment.amount;
    
    await caseData.addTimelineEntry(
      'in_progress',
      'Payment received. Case is now in progress.',
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: 'Payment confirmed successfully',
      data: {
        payment,
        case: caseData
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error confirming payment',
      error: error.message
    });
  }
};

// @desc    Request refund
// @route   POST /api/payments/:id/refund
// @access  Private
exports.requestRefund = async (req, res) => {
  try {
    const { reason } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check if already refunded
    if (payment.status === 'refunded') {
      return res.status(400).json({
        success: false,
        message: 'Payment already refunded'
      });
    }

    // Check case outcome (auto-approve if lost)
    const caseData = await Case.findById(payment.caseId);
    const autoApprove = caseData.outcome && caseData.outcome.type === 'guilty';

    payment.refund = {
      amount: payment.amount,
      reason,
      requestedAt: new Date(),
      status: autoApprove ? 'approved' : 'pending'
    };

    await payment.save();

    // If auto-approved, process refund immediately
    if (autoApprove) {
      return exports.processRefund(req, res);
    }

    res.status(200).json({
      success: true,
      message: 'Refund request submitted successfully',
      data: payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error requesting refund',
      error: error.message
    });
  }
};

// @desc    Process refund (Admin)
// @route   POST /api/payments/:id/process-refund
// @access  Private (Admin)
exports.processRefund = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.refund.status !== 'approved' && payment.refund.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Refund not approved'
      });
    }

    // Process refund with Stripe
    const refund = await stripe.refunds.create({
      charge: payment.stripeChargeId,
      amount: Math.round(payment.refund.amount * 100)
    });

    payment.status = 'refunded';
    payment.stripeRefundId = refund.id;
    payment.refund.status = 'completed';
    payment.refund.processedAt = new Date();

    await payment.save();

    // Update case
    const caseData = await Case.findById(payment.caseId);
    caseData.payment.status = 'refunded';
    caseData.pricing.refundAmount = payment.refund.amount;
    
    await caseData.addTimelineEntry(
      'closed',
      'Refund processed due to unsuccessful case outcome.',
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing refund',
      error: error.message
    });
  }
};

// @desc    Process lawyer payout
// @route   POST /api/payments/:id/payout
// @access  Private (Admin)
exports.processLawyerPayout = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.lawyerPayout.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Payout already processed or not eligible'
      });
    }

    // Get lawyer bank details
    const lawyer = await Lawyer.findById(payment.lawyerId);
    if (!lawyer || !lawyer.bankDetails.accountNumber) {
      return res.status(400).json({
        success: false,
        message: 'Lawyer bank details not found'
      });
    }

    // In production, integrate with Stripe Connect or bank transfer API
    // For now, just mark as processing
    payment.lawyerPayout.status = 'processing';
    payment.lawyerPayout.paidAt = new Date();
    
    await payment.save();

    // TODO: Actual payout integration
    // After successful payout, update status to 'completed'
    
    res.status(200).json({
      success: true,
      message: 'Lawyer payout initiated',
      data: payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing payout',
      error: error.message
    });
  }
};

// @desc    Get payment history
// @route   GET /api/payments
// @access  Private
exports.getPayments = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'user') {
      query.userId = req.user.id;
    } else if (req.user.role === 'lawyer') {
      const lawyer = await Lawyer.findOne({ userId: req.user.id });
      query.lawyerId = lawyer._id;
    }
    // Admin can see all payments

    const payments = await Payment.find(query)
      .populate('caseId')
      .populate('userId', 'firstName lastName email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payments',
      error: error.message
    });
  }
};

// @desc    Webhook handler for Stripe events
// @route   POST /api/payments/webhook
// @access  Public
exports.stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      // Handle successful payment
      break;
    case 'payment_intent.payment_failed':
      // Handle failed payment
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};
