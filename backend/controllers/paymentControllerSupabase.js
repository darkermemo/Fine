const { supabaseAdmin } = require('../config/supabase');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const generateTransactionId = () => {
  return `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const generateInvoiceNumber = () => {
  return `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

// @desc    Create a payment
// @route   POST /api/payments/create
// @access  Private
exports.createPayment = async (req, res) => {
  try {
    const { caseId, amount, paymentType, paymentMethodId, description } = req.body;
    const userId = req.user.profile.id;

    // Validate input
    if (!caseId || !amount || !paymentType) {
      return res.status(400).json({
        success: false,
        message: 'Please provide caseId, amount, and paymentType'
      });
    }

    // Get case details
    const { data: caseData } = await supabaseAdmin
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .single();

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe uses cents
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
      metadata: {
        userId: userId,
        caseId: caseId,
        paymentType: paymentType,
        description: description
      }
    });

    const transactionId = generateTransactionId();
    const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create payment record
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        payment_id: paymentId,
        transaction_id: transactionId,
        case_id: caseId,
        user_id: userId,
        lawyer_id: caseData.lawyer_id,
        amount: amount,
        payment_type: paymentType,
        status: paymentIntent.status === 'succeeded' ? 'completed' : 'pending',
        stripe_payment_intent_id: paymentIntent.id,
        stripe_charge_id: paymentIntent.charges.data[0]?.id,
        metadata: {
          description: description,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        }
      })
      .select()
      .single();

    if (paymentError) {
      return res.status(400).json({
        success: false,
        message: 'Error creating payment record'
      });
    }

    // Create transaction record
    const platformFee = amount * 0.1; // 10% platform fee
    const lawyerPayout = amount - platformFee;

    const { data: transaction } = await supabaseAdmin
      .from('transactions')
      .insert({
        transaction_id: transactionId,
        from_profile_id: userId,
        to_profile_id: caseData.lawyer_id,
        invoice_id: null,
        payment_id: payment.id,
        case_id: caseId,
        transaction_type: paymentType,
        amount: amount,
        status: 'completed',
        gross_amount: amount,
        platform_fee: platformFee,
        platform_fee_percentage: 10,
        net_amount: amount - platformFee,
        lawyer_payout_amount: lawyerPayout,
        lawyer_payout_status: 'pending',
        description: description,
        metadata: { stripeId: paymentIntent.id }
      })
      .select()
      .single();

    // Update case payment status
    await supabaseAdmin
      .from('cases')
      .update({
        payment_status: 'paid',
        paid_at: new Date().toISOString()
      })
      .eq('id', caseId);

    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      data: {
        payment,
        transaction,
        stripePaymentIntent: paymentIntent.id
      }
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating payment',
      error: error.message
    });
  }
};

// @desc    Get user payments
// @route   GET /api/payments
// @access  Private
exports.getPayments = async (req, res) => {
  try {
    const userId = req.user.profile.id;
    const { status, limit = 10, offset = 0 } = req.query;

    let query = supabaseAdmin
      .from('payments')
      .select('*', { count: 'exact' })
      .or(`user_id.eq.${userId},lawyer_id.eq.${userId}`);

    if (status) {
      query = query.eq('status', status);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: payments, error, count } = await query;

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Error fetching payments'
      });
    }

    res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: count > (parseInt(offset) + parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Fetch payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payments',
      error: error.message
    });
  }
};

// @desc    Get payment by ID
// @route   GET /api/payments/:paymentId
// @access  Private
exports.getPaymentById = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user.profile.id;

    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (error || !payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check authorization
    if (payment.user_id !== userId && payment.lawyer_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this payment'
      });
    }

    res.status(200).json({
      success: true,
      data: payment
    });

  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment',
      error: error.message
    });
  }
};

// @desc    Create invoice
// @route   POST /api/invoices/create
// @access  Private
exports.createInvoice = async (req, res) => {
  try {
    const { userId, lawyerId, caseId, lineItems, taxPercentage = 0, discountAmount = 0, notes, terms } = req.body;
    const createdByUserId = req.user.profile.id;

    // Validate that user is admin or the invoice creator
    const userRole = req.user.profile.roles?.name;
    if (userRole !== 'admin' && userRole !== 'business_support' && createdByUserId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create invoices for this user'
      });
    }

    if (!lineItems || lineItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide line items'
      });
    }

    // Calculate totals
    const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxAmount = subtotal * (taxPercentage / 100);
    const totalAmount = subtotal + taxAmount - (discountAmount || 0);

    const invoiceNumber = generateInvoiceNumber();

    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        user_id: userId,
        lawyer_id: lawyerId,
        case_id: caseId,
        status: 'draft',
        line_items: lineItems,
        subtotal: subtotal,
        tax_amount: taxAmount,
        tax_percentage: taxPercentage,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        paid_amount: 0,
        notes: notes,
        terms: terms,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      })
      .select()
      .single();

    if (invoiceError) {
      return res.status(400).json({
        success: false,
        message: 'Error creating invoice'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: invoice
    });

  } catch (error) {
    console.error('Invoice creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating invoice',
      error: error.message
    });
  }
};

// @desc    Get invoices
// @route   GET /api/invoices
// @access  Private
exports.getInvoices = async (req, res) => {
  try {
    const userId = req.user.profile.id;
    const { status, limit = 10, offset = 0 } = req.query;
    const userRole = req.user.profile.roles?.name;

    let query = supabaseAdmin
      .from('invoices')
      .select('*', { count: 'exact' });

    // Admin and business support can see all invoices
    if (userRole !== 'admin' && userRole !== 'business_support') {
      query = query.or(`user_id.eq.${userId},lawyer_id.eq.${userId}`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: invoices, error, count } = await query;

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Error fetching invoices'
      });
    }

    res.status(200).json({
      success: true,
      data: invoices,
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: count > (parseInt(offset) + parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Fetch invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invoices',
      error: error.message
    });
  }
};

// @desc    Get transactions for dashboard
// @route   GET /api/transactions
// @access  Private
exports.getTransactions = async (req, res) => {
  try {
    const userId = req.user.profile.id;
    const { limit = 20, offset = 0, transactionType, status } = req.query;
    const userRole = req.user.profile.roles?.name;

    let query = supabaseAdmin
      .from('transactions')
      .select('*', { count: 'exact' });

    // Admin/support can see all, others see their own
    if (userRole !== 'admin' && userRole !== 'business_support') {
      query = query.or(`from_profile_id.eq.${userId},to_profile_id.eq.${userId}`);
    }

    if (transactionType) {
      query = query.eq('transaction_type', transactionType);
    }

    if (status) {
      query = query.eq('status', status);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: transactions, error, count } = await query;

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Error fetching transactions'
      });
    }

    res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: count > (parseInt(offset) + parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Fetch transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions',
      error: error.message
    });
  }
};

// @desc    Process refund
// @route   POST /api/refunds/create
// @access  Private
exports.createRefund = async (req, res) => {
  try {
    const { paymentId, reason, amount } = req.body;
    const userId = req.user.profile.id;
    const userRole = req.user.profile.roles?.name;

    if (!paymentId || !reason || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Please provide paymentId, reason, and amount'
      });
    }

    // Get payment
    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check authorization
    if (payment.user_id !== userId && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to refund this payment'
      });
    }

    // Process Stripe refund
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripe_payment_intent_id,
      amount: Math.round(amount * 100)
    });

    const refundId = `REF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create refund record
    const { data: refundRecord, error: refundError } = await supabaseAdmin
      .from('refunds')
      .insert({
        refund_id: refundId,
        transaction_id: payment.transaction_id,
        payment_id: paymentId,
        reason: reason,
        amount: amount,
        status: refund.status === 'succeeded' ? 'completed' : 'pending',
        approved_by: userId,
        processed_at: new Date().toISOString(),
        metadata: { stripeRefundId: refund.id }
      })
      .select()
      .single();

    if (refundError) {
      return res.status(400).json({
        success: false,
        message: 'Error creating refund'
      });
    }

    // Update payment status
    await supabaseAdmin
      .from('payments')
      .update({ status: 'refunded' })
      .eq('id', paymentId);

    res.status(201).json({
      success: true,
      message: 'Refund created successfully',
      data: refundRecord
    });

  } catch (error) {
    console.error('Refund creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating refund',
      error: error.message
    });
  }
};

// @desc    Get financial summary for dashboard
// @route   GET /api/dashboard/financial-summary
// @access  Private
exports.getFinancialSummary = async (req, res) => {
  try {
    const userId = req.user.profile.id;
    const userRole = req.user.profile.roles?.name;

    let query = supabaseAdmin
      .from('transactions')
      .select('*');

    if (userRole !== 'admin' && userRole !== 'business_support') {
      query = query.or(`from_profile_id.eq.${userId},to_profile_id.eq.${userId}`);
    }

    const { data: transactions } = await query;

    // Calculate summary
    const totalRevenue = transactions
      .filter(t => t.transaction_type === 'case_payment' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalPayouts = transactions
      .filter(t => t.lawyer_payout_status === 'completed')
      .reduce((sum, t) => sum + t.lawyer_payout_amount, 0);

    const totalFees = transactions
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + (t.platform_fee || 0), 0);

    const pendingPayouts = transactions
      .filter(t => t.lawyer_payout_status === 'pending')
      .reduce((sum, t) => sum + t.lawyer_payout_amount, 0);

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        totalPayouts,
        totalFees,
        pendingPayouts,
        transactionCount: transactions.length,
        completedTransactions: transactions.filter(t => t.status === 'completed').length,
        pendingTransactions: transactions.filter(t => t.status === 'pending').length
      }
    });

  } catch (error) {
    console.error('Financial summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching financial summary',
      error: error.message
    });
  }
};
