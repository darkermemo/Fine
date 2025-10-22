const { supabaseAdmin } = require('../config/supabase');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN: GET ALL SUBSCRIPTION PLANS
// ═══════════════════════════════════════════════════════════════════════════════

// @desc    Get all subscription plans (admin view)
// @route   GET /api/admin/subscription/plans
// @access  Private (Admin only)
exports.getAllPlans = async (req, res) => {
  try {
    const { data: plans, error } = await supabaseAdmin
      .from('business_subscription_plans')
      .select('*')
      .order('display_order');

    if (error) throw error;

    res.status(200).json({
      success: true,
      count: plans.length,
      data: plans
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching plans',
      error: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN: CREATE NEW SUBSCRIPTION PLAN
// ═══════════════════════════════════════════════════════════════════════════════

// @desc    Create new subscription plan
// @route   POST /api/admin/subscription/plans
// @access  Private (Admin only)
exports.createPlan = async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      monthly_price,
      setup_fee,
      max_fines_per_month,
      max_employees,
      features,
      display_order,
      is_active
    } = req.body;

    // Validate required fields
    if (!name || !slug || !monthly_price) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, slug, monthly_price'
      });
    }

    // Create plan
    const { data: plan, error } = await supabaseAdmin
      .from('business_subscription_plans')
      .insert([{
        name,
        slug,
        description,
        monthly_price,
        setup_fee: setup_fee || 0,
        max_fines_per_month,
        max_employees,
        features: features || {},
        display_order: display_order || 999,
        is_active: is_active !== false
      }])
      .select()
      .single();

    if (error) throw error;

    // Log admin action
    await supabaseAdmin
      .from('audit_logs')
      .insert([{
        admin_id: req.user.id,
        action: 'create_subscription_plan',
        entity_type: 'subscription_plan',
        entity_id: plan.id,
        details: { plan_name: name },
        timestamp: new Date()
      }]);

    res.status(201).json({
      success: true,
      message: 'Subscription plan created',
      data: plan
    });
  } catch (error) {
    console.error('Error creating plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating plan',
      error: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN: UPDATE SUBSCRIPTION PLAN
// ═══════════════════════════════════════════════════════════════════════════════

// @desc    Update subscription plan
// @route   PUT /api/admin/subscription/plans/:planId
// @access  Private (Admin only)
exports.updatePlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const updates = req.body;

    // Don't allow slug changes (it's used as identifier)
    delete updates.id;

    const { data: plan, error } = await supabaseAdmin
      .from('business_subscription_plans')
      .update(updates)
      .eq('id', planId)
      .select()
      .single();

    if (error) throw error;

    // Log admin action
    await supabaseAdmin
      .from('audit_logs')
      .insert([{
        admin_id: req.user.id,
        action: 'update_subscription_plan',
        entity_type: 'subscription_plan',
        entity_id: planId,
        details: { changes: updates },
        timestamp: new Date()
      }]);

    res.status(200).json({
      success: true,
      message: 'Subscription plan updated',
      data: plan
    });
  } catch (error) {
    console.error('Error updating plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating plan',
      error: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN: UPDATE PLAN PRICING
// ═══════════════════════════════════════════════════════════════════════════════

// @desc    Update plan pricing (quick update)
// @route   PUT /api/admin/subscription/plans/:planId/pricing
// @access  Private (Admin only)
exports.updatePlanPricing = async (req, res) => {
  try {
    const { planId } = req.params;
    const { monthly_price, setup_fee, max_fines_per_month } = req.body;

    const updates = {};
    if (monthly_price !== undefined) updates.monthly_price = monthly_price;
    if (setup_fee !== undefined) updates.setup_fee = setup_fee;
    if (max_fines_per_month !== undefined) updates.max_fines_per_month = max_fines_per_month;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No pricing fields to update'
      });
    }

    const { data: plan, error } = await supabaseAdmin
      .from('business_subscription_plans')
      .update(updates)
      .eq('id', planId)
      .select()
      .single();

    if (error) throw error;

    // Log admin action
    await supabaseAdmin
      .from('audit_logs')
      .insert([{
        admin_id: req.user.id,
        action: 'update_plan_pricing',
        entity_type: 'subscription_plan',
        entity_id: planId,
        details: { old_price: plan.monthly_price, new_price: monthly_price },
        timestamp: new Date()
      }]);

    res.status(200).json({
      success: true,
      message: 'Plan pricing updated',
      data: plan
    });
  } catch (error) {
    console.error('Error updating pricing:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating pricing',
      error: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN: UPDATE PLAN FEATURES
// ═══════════════════════════════════════════════════════════════════════════════

// @desc    Update plan features
// @route   PUT /api/admin/subscription/plans/:planId/features
// @access  Private (Admin only)
exports.updatePlanFeatures = async (req, res) => {
  try {
    const { planId } = req.params;
    const features = req.body; // New features object

    const { data: plan, error } = await supabaseAdmin
      .from('business_subscription_plans')
      .update({ features })
      .eq('id', planId)
      .select()
      .single();

    if (error) throw error;

    // Log admin action
    await supabaseAdmin
      .from('audit_logs')
      .insert([{
        admin_id: req.user.id,
        action: 'update_plan_features',
        entity_type: 'subscription_plan',
        entity_id: planId,
        details: { new_features: features },
        timestamp: new Date()
      }]);

    res.status(200).json({
      success: true,
      message: 'Plan features updated',
      data: plan
    });
  } catch (error) {
    console.error('Error updating features:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating features',
      error: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN: DELETE SUBSCRIPTION PLAN
// ═══════════════════════════════════════════════════════════════════════════════

// @desc    Delete subscription plan
// @route   DELETE /api/admin/subscription/plans/:planId
// @access  Private (Admin only)
exports.deletePlan = async (req, res) => {
  try {
    const { planId } = req.params;

    // Check if any businesses use this plan
    const { data: businesses } = await supabaseAdmin
      .from('business_accounts')
      .select('id')
      .eq('plan_id', planId);

    if (businesses && businesses.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete plan - ${businesses.length} businesses are using this plan`
      });
    }

    // Soft delete by setting is_active to false
    const { error } = await supabaseAdmin
      .from('business_subscription_plans')
      .update({ is_active: false })
      .eq('id', planId);

    if (error) throw error;

    // Log admin action
    await supabaseAdmin
      .from('audit_logs')
      .insert([{
        admin_id: req.user.id,
        action: 'delete_subscription_plan',
        entity_type: 'subscription_plan',
        entity_id: planId,
        timestamp: new Date()
      }]);

    res.status(200).json({
      success: true,
      message: 'Subscription plan deleted'
    });
  } catch (error) {
    console.error('Error deleting plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting plan',
      error: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN: GET SUBSCRIPTION ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════════

// @desc    Get subscription analytics
// @route   GET /api/admin/subscription/analytics
// @access  Private (Admin only)
exports.getSubscriptionAnalytics = async (req, res) => {
  try {
    // Get all businesses
    const { data: businesses } = await supabaseAdmin
      .from('business_accounts')
      .select('*, business_subscription_plans(name, monthly_price)');

    // Get active businesses (verified)
    const activeBusinesses = businesses.filter(b => b.is_verified && b.is_active);

    // Get total revenue
    const { data: billing } = await supabaseAdmin
      .from('business_billing_history')
      .select('total, payment_status');

    const totalRevenue = billing
      .filter(b => b.payment_status === 'paid')
      .reduce((sum, b) => sum + b.total, 0);

    // Group by plan
    const byPlan = {};
    activeBusinesses.forEach(b => {
      const planName = b.business_subscription_plans?.name || 'Unknown';
      if (!byPlan[planName]) {
        byPlan[planName] = {
          count: 0,
          monthly_revenue: 0,
          annual_revenue: 0
        };
      }
      byPlan[planName].count++;
      byPlan[planName].monthly_revenue += b.business_subscription_plans?.monthly_price || 0;
      byPlan[planName].annual_revenue = byPlan[planName].monthly_revenue * 12;
    });

    // Get pending invoices
    const { data: pending } = await supabaseAdmin
      .from('business_billing_history')
      .select('total')
      .eq('payment_status', 'pending');

    const pendingRevenue = pending.reduce((sum, p) => sum + p.total, 0);

    res.status(200).json({
      success: true,
      data: {
        total_businesses: activeBusinesses.length,
        total_paid_revenue: totalRevenue,
        pending_revenue: pendingRevenue,
        monthly_recurring_revenue: Object.values(byPlan).reduce((sum, p) => sum + p.monthly_revenue, 0),
        annual_recurring_revenue: Object.values(byPlan).reduce((sum, p) => sum + p.annual_revenue, 0),
        by_plan: byPlan
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN: GET PENDING BILLINGS
// ═══════════════════════════════════════════════════════════════════════════════

// @desc    Get pending billings
// @route   GET /api/admin/subscription/pending-billings
// @access  Private (Admin only)
exports.getPendingBillings = async (req, res) => {
  try {
    const { data: pending, error } = await supabaseAdmin
      .from('business_billing_history')
      .select('*, business_accounts(company_name)')
      .eq('payment_status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({
      success: true,
      count: pending.length,
      data: pending
    });
  } catch (error) {
    console.error('Error fetching pending billings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending billings',
      error: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN: RETRY PAYMENT FOR FAILED INVOICE
// ═══════════════════════════════════════════════════════════════════════════════

// @desc    Retry payment for failed invoice
// @route   POST /api/admin/subscription/retry-payment/:invoiceId
// @access  Private (Admin only)
exports.retryPayment = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    // Get invoice
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('business_billing_history')
      .select('*, business_accounts(stripe_customer_id)')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Charge Stripe
    const charge = await stripe.charges.create({
      amount: invoice.total * 100, // Convert to cents
      currency: 'sar',
      customer: invoice.business_accounts.stripe_customer_id,
      description: `Invoice ${invoice.invoice_number}`
    });

    // Update invoice
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('business_billing_history')
      .update({
        payment_status: 'paid',
        payment_date: new Date(),
        stripe_charge_id: charge.id
      })
      .eq('id', invoiceId)
      .select()
      .single();

    if (updateError) throw updateError;

    res.status(200).json({
      success: true,
      message: 'Payment processed',
      data: updated
    });
  } catch (error) {
    console.error('Error retrying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrying payment',
      error: error.message
    });
  }
};
