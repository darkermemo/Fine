const { supabaseAdmin } = require('../config/supabase');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOMER: INITIATE CHECKOUT
// ═══════════════════════════════════════════════════════════════════════════════

// @desc    Initiate subscription checkout (create Stripe session)
// @route   POST /api/subscriptions/checkout
// @access  Private
exports.initiateCheckout = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      plan_id,
      company_name,
      company_registration,
      business_type,
      contact_email,
      contact_phone,
      contact_person,
      city,
      region,
      return_url
    } = req.body;

    // Validate required fields
    if (!plan_id || !company_name || !contact_email) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Get plan details
    const { data: plan, error: planError } = await supabaseAdmin
      .from('business_subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .single();

    if (planError || !plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    // Create Stripe customer
    const stripeCustomer = await stripe.customers.create({
      email: contact_email,
      name: company_name,
      description: `Business: ${company_name}`,
      metadata: {
        user_id: userId,
        company_registration: company_registration || '',
        business_type: business_type || ''
      }
    });

    // Create pending business account
    const { data: business, error: businessError } = await supabaseAdmin
      .from('business_accounts')
      .insert([{
        company_name,
        company_registration,
        business_type,
        contact_email,
        contact_phone,
        contact_person,
        city,
        region,
        plan_id,
        stripe_customer_id: stripeCustomer.id,
        account_manager_id: userId,
        is_verified: false,
        is_active: false // Not active until payment confirmed
      }])
      .select()
      .single();

    if (businessError) throw businessError;

    // Calculate line items for Stripe checkout
    const lineItems = [
      {
        price_data: {
          currency: 'sar',
          product_data: {
            name: plan.name,
            description: plan.description
          },
          unit_amount: plan.monthly_price * 100 // Convert to cents
        },
        quantity: 1
      }
    ];

    // Add setup fee if exists
    if (plan.setup_fee && plan.setup_fee > 0) {
      lineItems.push({
        price_data: {
          currency: 'sar',
          product_data: {
            name: 'Setup Fee',
            description: `One-time setup fee for ${plan.name}`
          },
          unit_amount: plan.setup_fee * 100
        },
        quantity: 1
      });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomer.id,
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'sar',
            product_data: {
              name: plan.name,
              description: plan.description
            },
            unit_amount: plan.monthly_price * 100,
            recurring: {
              interval: 'month',
              interval_count: 1
            }
          },
          quantity: 1
        }
      ],
      success_url: `${return_url || process.env.CLIENT_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}&business_id=${business.id}`,
      cancel_url: `${return_url || process.env.CLIENT_URL}/subscription/cancel`,
      metadata: {
        business_id: business.id,
        plan_id: plan_id
      }
    });

    res.status(200).json({
      success: true,
      message: 'Checkout session created',
      data: {
        session_id: session.id,
        checkout_url: session.url,
        business_id: business.id,
        stripe_customer_id: stripeCustomer.id
      }
    });
  } catch (error) {
    console.error('Error initiating checkout:', error);
    res.status(500).json({
      success: false,
      message: 'Error initiating checkout',
      error: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOMER: CONFIRM PAYMENT & ACTIVATE SUBSCRIPTION
// ═══════════════════════════════════════════════════════════════════════════════

// @desc    Confirm payment and activate subscription
// @route   POST /api/subscriptions/confirm-payment
// @access  Private
exports.confirmPayment = async (req, res) => {
  try {
    const { session_id, business_id } = req.body;

    if (!session_id || !business_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing session_id or business_id'
      });
    }

    // Retrieve Stripe session
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (session.payment_status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed',
        payment_status: session.payment_status
      });
    }

    // Get business account
    const { data: business } = await supabaseAdmin
      .from('business_accounts')
      .select('*')
      .eq('id', business_id)
      .single();

    // Calculate renewal date
    const now = new Date();
    const renewalDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    // Activate business account
    const { data: updated, error } = await supabaseAdmin
      .from('business_accounts')
      .update({
        is_active: true,
        is_verified: true,
        verification_date: now,
        subscription_starts: now,
        subscription_renews: renewalDate,
        auto_renew: true
      })
      .eq('id', business_id)
      .select()
      .single();

    if (error) throw error;

    // Create first billing record
    const { data: plan } = await supabaseAdmin
      .from('business_subscription_plans')
      .select('monthly_price, setup_fee')
      .eq('id', business.plan_id)
      .single();

    const subtotal = (plan.monthly_price + (plan.setup_fee || 0));
    const tax = Math.round(subtotal * 0.15);
    const total = subtotal + tax;

    await supabaseAdmin
      .from('business_billing_history')
      .insert([{
        business_id,
        invoice_number: `INV-${business_id.slice(0, 8)}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`,
        billing_period_start: new Date(now.getFullYear(), now.getMonth(), 1),
        billing_period_end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        plan_fee: plan.monthly_price,
        setup_fee: plan.setup_fee || 0,
        subtotal,
        tax,
        total,
        payment_status: 'paid',
        payment_date: now,
        stripe_charge_id: session.payment_intent
      }]);

    // Create monthly usage record
    await supabaseAdmin
      .from('business_monthly_usage')
      .insert([{
        business_id,
        year: now.getFullYear(),
        month: now.getMonth() + 1
      }]);

    // Add account manager as admin employee
    await supabaseAdmin
      .from('business_employees')
      .insert([{
        business_id,
        user_id: business.account_manager_id,
        role: 'admin',
        full_name: business.contact_person,
        email: business.contact_email,
        added_by: business.account_manager_id
      }]);

    res.status(200).json({
      success: true,
      message: 'Subscription activated successfully',
      data: {
        business: updated,
        subscription_starts: now,
        subscription_renews: renewalDate
      }
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error confirming payment',
      error: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOMER: GET SUBSCRIPTION STATUS
// ═══════════════════════════════════════════════════════════════════════════════

// @desc    Get subscription status
// @route   GET /api/subscriptions/:businessId/status
// @access  Private
exports.getSubscriptionStatus = async (req, res) => {
  try {
    const { businessId } = req.params;

    const { data: business, error } = await supabaseAdmin
      .from('business_accounts')
      .select('*, business_subscription_plans(*)')
      .eq('id', businessId)
      .single();

    if (error) throw error;
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    // Get current month usage
    const now = new Date();
    const { data: usage } = await supabaseAdmin
      .from('business_monthly_usage')
      .select('*')
      .eq('business_id', businessId)
      .eq('year', now.getFullYear())
      .eq('month', now.getMonth() + 1)
      .single();

    res.status(200).json({
      success: true,
      data: {
        business_id: businessId,
        company_name: business.company_name,
        plan_name: business.business_subscription_plans?.name,
        is_active: business.is_active,
        is_verified: business.is_verified,
        subscription_starts: business.subscription_starts,
        subscription_renews: business.subscription_renews,
        auto_renew: business.auto_renew,
        current_month_usage: usage,
        plan_limits: {
          max_fines_per_month: business.business_subscription_plans?.max_fines_per_month,
          max_employees: business.business_subscription_plans?.max_employees
        }
      }
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription status',
      error: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOMER: UPDATE SUBSCRIPTION (UPGRADE/DOWNGRADE)
// ═══════════════════════════════════════════════════════════════════════════════

// @desc    Change subscription plan
// @route   POST /api/subscriptions/:businessId/change-plan
// @access  Private
exports.changePlan = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { new_plan_id, return_url } = req.body;

    // Get current business
    const { data: business } = await supabaseAdmin
      .from('business_accounts')
      .select('*, business_subscription_plans(*)')
      .eq('id', businessId)
      .single();

    // Get new plan
    const { data: newPlan } = await supabaseAdmin
      .from('business_subscription_plans')
      .select('*')
      .eq('id', new_plan_id)
      .single();

    if (!newPlan) {
      return res.status(404).json({ success: false, message: 'New plan not found' });
    }

    // Create Stripe Checkout Session for plan change
    const session = await stripe.checkout.sessions.create({
      customer: business.stripe_customer_id,
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'sar',
            product_data: {
              name: newPlan.name,
              description: `Upgrade/Downgrade from ${business.business_subscription_plans?.name}`
            },
            unit_amount: newPlan.monthly_price * 100,
            recurring: {
              interval: 'month',
              interval_count: 1
            }
          },
          quantity: 1
        }
      ],
      success_url: `${return_url || process.env.CLIENT_URL}/subscription/plan-changed?business_id=${businessId}&plan_id=${new_plan_id}`,
      cancel_url: `${return_url || process.env.CLIENT_URL}/subscription/cancel`,
      metadata: {
        business_id: businessId,
        new_plan_id: new_plan_id,
        old_plan_id: business.plan_id,
        action: 'plan_change'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Plan change session created',
      data: {
        session_id: session.id,
        checkout_url: session.url
      }
    });
  } catch (error) {
    console.error('Error changing plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing plan',
      error: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOMER: CANCEL SUBSCRIPTION
// ═══════════════════════════════════════════════════════════════════════════════

// @desc    Cancel subscription
// @route   POST /api/subscriptions/:businessId/cancel
// @access  Private
exports.cancelSubscription = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { reason } = req.body;

    // Update business
    const { data: business, error } = await supabaseAdmin
      .from('business_accounts')
      .update({
        is_active: false,
        auto_renew: false
      })
      .eq('id', businessId)
      .select()
      .single();

    if (error) throw error;

    // Log cancellation
    await supabaseAdmin
      .from('audit_logs')
      .insert([{
        user_id: req.user.id,
        action: 'cancel_subscription',
        entity_type: 'business_account',
        entity_id: businessId,
        details: { reason: reason || 'No reason provided' },
        timestamp: new Date()
      }]);

    res.status(200).json({
      success: true,
      message: 'Subscription cancelled',
      data: business
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling subscription',
      error: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// WEBHOOK: HANDLE STRIPE EVENTS
// ═══════════════════════════════════════════════════════════════════════════════

// @desc    Handle Stripe webhook
// @route   POST /api/webhooks/stripe
// @access  Public (Stripe verified)
exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log('Checkout completed:', session.id);
        // Payment completed, subscription activated
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        console.log('Payment failed for invoice:', failedInvoice.id);
        // Send notification to business
        break;

      case 'invoice.payment_succeeded':
        const succeededInvoice = event.data.object;
        console.log('Payment succeeded for invoice:', succeededInvoice.id);
        // Update invoice status in database
        break;

      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        console.log('Subscription deleted:', subscription.id);
        // Mark business as cancelled
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
