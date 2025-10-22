const { supabaseAdmin } = require('../config/supabase');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// ═══════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION PLANS
// ═══════════════════════════════════════════════════════════════════════════════

// @desc    Get all subscription plans
// @route   GET /api/b2b/plans
// @access  Public
exports.getPlans = async (req, res) => {
  try {
    const { data: plans, error } = await supabaseAdmin
      .from('business_subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) throw error;

    res.status(200).json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription plans',
      error: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// BUSINESS ACCOUNT MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

// @desc    Create new business account
// @route   POST /api/b2b/accounts
// @access  Private
exports.createBusinessAccount = async (req, res) => {
  try {
    const { 
      company_name, 
      company_registration,
      business_type,
      contact_email, 
      contact_phone,
      contact_person,
      city,
      region,
      plan_id 
    } = req.body;

    const userId = req.user.id;

    // Create Stripe customer
    const stripeCustomer = await stripe.customers.create({
      email: contact_email,
      name: company_name,
      description: `B2B Account: ${company_name}`
    });

    // Create business account in Supabase
    const { data: business, error } = await supabaseAdmin
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
        account_manager_id: userId
      }])
      .select()
      .single();

    if (error) throw error;

    // Add account manager as business admin
    await supabaseAdmin
      .from('business_employees')
      .insert([{
        business_id: business.id,
        user_id: userId,
        role: 'admin',
        full_name: contact_person,
        email: contact_email
      }]);

    // Create monthly usage record
    const now = new Date();
    await supabaseAdmin
      .from('business_monthly_usage')
      .insert([{
        business_id: business.id,
        year: now.getFullYear(),
        month: now.getMonth() + 1
      }]);

    res.status(201).json({
      success: true,
      message: 'Business account created successfully',
      data: business
    });
  } catch (error) {
    console.error('Error creating business account:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating business account',
      error: error.message
    });
  }
};

// @desc    Get business account details
// @route   GET /api/b2b/accounts/:businessId
// @access  Private (Business admin or account manager)
exports.getBusinessAccount = async (req, res) => {
  try {
    const { businessId } = req.params;
    const userId = req.user.id;

    // Verify access
    const { data: business, error: businessError } = await supabaseAdmin
      .from('business_accounts')
      .select('*, business_subscription_plans(*)')
      .eq('id', businessId)
      .single();

    if (businessError) throw businessError;
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
        ...business,
        current_month_usage: usage
      }
    });
  } catch (error) {
    console.error('Error fetching business account:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching business account',
      error: error.message
    });
  }
};

// @desc    Update business account
// @route   PUT /api/b2b/accounts/:businessId
// @access  Private (Business admin)
exports.updateBusinessAccount = async (req, res) => {
  try {
    const { businessId } = req.params;
    const updates = req.body;

    const { data: business, error } = await supabaseAdmin
      .from('business_accounts')
      .update(updates)
      .eq('id', businessId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: 'Business account updated',
      data: business
    });
  } catch (error) {
    console.error('Error updating business account:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating business account',
      error: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// EMPLOYEE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

// @desc    Add employee to business
// @route   POST /api/b2b/accounts/:businessId/employees
// @access  Private (Business admin)
exports.addEmployee = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { user_id, full_name, email, phone, id_number, role } = req.body;

    // Check if user exists
    const { data: user, error: userError } = await supabaseAdmin
      .auth.admin.getUserById(user_id);

    if (userError || !user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Add employee
    const { data: employee, error } = await supabaseAdmin
      .from('business_employees')
      .insert([{
        business_id: businessId,
        user_id,
        full_name,
        email,
        phone,
        id_number,
        role: role || 'employee',
        added_by: req.user.id
      }])
      .select()
      .single();

    if (error) throw error;

    // Send notification to employee
    await supabaseAdmin
      .from('business_notifications')
      .insert([{
        business_id: businessId,
        type: 'employee_added',
        title: 'Added to business account',
        message: `You've been added to ${businessId} as an employee`
      }]);

    res.status(201).json({
      success: true,
      message: 'Employee added successfully',
      data: employee
    });
  } catch (error) {
    console.error('Error adding employee:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding employee',
      error: error.message
    });
  }
};

// @desc    Get business employees
// @route   GET /api/b2b/accounts/:businessId/employees
// @access  Private (Business members)
exports.getEmployees = async (req, res) => {
  try {
    const { businessId } = req.params;

    const { data: employees, error } = await supabaseAdmin
      .from('business_employees')
      .select('*')
      .eq('business_id', businessId)
      .order('added_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employees',
      error: error.message
    });
  }
};

// @desc    Update employee
// @route   PUT /api/b2b/accounts/:businessId/employees/:employeeId
// @access  Private (Business admin)
exports.updateEmployee = async (req, res) => {
  try {
    const { businessId, employeeId } = req.params;
    const updates = req.body;

    const { data: employee, error } = await supabaseAdmin
      .from('business_employees')
      .update(updates)
      .eq('id', employeeId)
      .eq('business_id', businessId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: 'Employee updated',
      data: employee
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating employee',
      error: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// FINE SUBMISSION WITH USAGE TRACKING
// ═══════════════════════════════════════════════════════════════════════════════

// @desc    Submit fine on behalf of business
// @route   POST /api/b2b/accounts/:businessId/submit-fine
// @access  Private (Business employee)
exports.submitFineForBusiness = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { case_id, fine_type_id, fine_amount, employee_id } = req.body;

    // Check current usage
    const now = new Date();
    const { data: limit_info, error: limitError } = await supabaseAdmin
      .rpc('check_business_fine_limit', {
        p_business_id: businessId,
        p_month: now.getMonth() + 1,
        p_year: now.getFullYear()
      });

    if (limitError) throw limitError;

    const limit = limit_info[0];
    let included_in_plan = limit.can_submit;
    let extra_charge = 0;

    // If exceeded limit, charge extra
    if (!limit.can_submit && limit.fines_limit !== null) {
      extra_charge = 50; // 50 SAR per extra fine
      
      // Call function to charge extra
      await supabaseAdmin.rpc('charge_extra_fine', {
        p_business_id: businessId,
        p_month: now.getMonth() + 1,
        p_year: now.getFullYear()
      });
    }

    // Submit fine
    const { data: submission, error } = await supabaseAdmin
      .from('business_fine_submissions')
      .insert([{
        business_id: businessId,
        case_id,
        fine_type_id,
        fine_amount,
        employee_id,
        included_in_plan,
        extra_charge
      }])
      .select()
      .single();

    if (error) throw error;

    // Update monthly usage
    await supabaseAdmin
      .from('business_monthly_usage')
      .update({ fines_submitted: limit.fines_used + 1 })
      .eq('business_id', businessId)
      .eq('year', now.getFullYear())
      .eq('month', now.getMonth() + 1);

    // Notify if nearing limit
    if (limit.fines_limit && (limit.fines_used + 1) >= (limit.fines_limit * 0.8)) {
      await supabaseAdmin
        .from('business_notifications')
        .insert([{
          business_id: businessId,
          type: 'limit_warning',
          title: 'Fine submission limit warning',
          message: `You've used ${limit.fines_used + 1} of ${limit.fines_limit} fines this month`
        }]);
    }

    res.status(201).json({
      success: true,
      message: 'Fine submitted successfully',
      data: {
        submission,
        usage: {
          fines_used: limit.fines_used + 1,
          fines_limit: limit.fines_limit,
          message: limit.message,
          extra_charge: extra_charge
        }
      }
    });
  } catch (error) {
    console.error('Error submitting fine:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting fine',
      error: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// BILLING & INVOICES
// ═══════════════════════════════════════════════════════════════════════════════

// @desc    Get billing history
// @route   GET /api/b2b/accounts/:businessId/billing
// @access  Private (Business admin)
exports.getBillingHistory = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { limit = 12, offset = 0 } = req.query;

    const { data: bills, error } = await supabaseAdmin
      .from('business_billing_history')
      .select('*')
      .eq('business_id', businessId)
      .order('billing_period_end', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.status(200).json({
      success: true,
      count: bills.length,
      data: bills
    });
  } catch (error) {
    console.error('Error fetching billing history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching billing history',
      error: error.message
    });
  }
};

// @desc    Create monthly invoice
// @route   POST /api/b2b/accounts/:businessId/invoice
// @access  Private (Admin only)
exports.createMonthlyInvoice = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { month, year } = req.body;

    // Get business and plan info
    const { data: business } = await supabaseAdmin
      .from('business_accounts')
      .select('*, business_subscription_plans(monthly_price, setup_fee)')
      .eq('id', businessId)
      .single();

    // Get monthly usage
    const { data: usage } = await supabaseAdmin
      .from('business_monthly_usage')
      .select('*')
      .eq('business_id', businessId)
      .eq('year', year)
      .eq('month', month)
      .single();

    if (!usage) {
      return res.status(404).json({ success: false, message: 'No usage data for this month' });
    }

    // Calculate invoice
    const plan_fee = business.business_subscription_plans.monthly_price;
    const setup_fee = business.business_subscription_plans.setup_fee || 0;
    const extra_fines_cost = usage.extra_fine_cost || 0;
    const subtotal = plan_fee + setup_fee + extra_fines_cost;
    const tax = Math.round(subtotal * 0.15); // 15% VAT
    const total = subtotal + tax;

    // Generate invoice number
    const invoice_number = `INV-${businessId.slice(0, 8)}-${year}${String(month).padStart(2, '0')}`;

    // Create invoice
    const { data: invoice, error } = await supabaseAdmin
      .from('business_billing_history')
      .insert([{
        business_id: businessId,
        invoice_number,
        billing_period_start: new Date(year, month - 1, 1),
        billing_period_end: new Date(year, month, 0),
        plan_fee,
        setup_fee,
        extra_fines_count: usage.fines_extra,
        extra_fines_cost,
        subtotal,
        tax,
        total
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Invoice created',
      data: invoice
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating invoice',
      error: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// ANALYTICS & REPORTING
// ═══════════════════════════════════════════════════════════════════════════════

// @desc    Get business dashboard/analytics
// @route   GET /api/b2b/accounts/:businessId/analytics
// @access  Private (Business members)
exports.getBusinessAnalytics = async (req, res) => {
  try {
    const { businessId } = req.params;

    // Get current month usage
    const now = new Date();
    const { data: currentMonth } = await supabaseAdmin
      .from('business_monthly_usage')
      .select('*')
      .eq('business_id', businessId)
      .eq('year', now.getFullYear())
      .eq('month', now.getMonth() + 1)
      .single();

    // Get submissions this month
    const { data: submissions } = await supabaseAdmin
      .from('business_fine_submissions')
      .select('*, fine_types(*)')
      .eq('business_id', businessId)
      .gte('created_at', new Date(now.getFullYear(), now.getMonth(), 1).toISOString());

    // Get plan info
    const { data: business } = await supabaseAdmin
      .from('business_accounts')
      .select('*, business_subscription_plans(*)')
      .eq('id', businessId)
      .single();

    res.status(200).json({
      success: true,
      data: {
        current_month: currentMonth,
        submissions_this_month: submissions.length,
        fine_types_breakdown: submissions.reduce((acc, s) => {
          const existing = acc.find(a => a.fine_type_id === s.fine_type_id);
          if (existing) {
            existing.count++;
          } else {
            acc.push({
              fine_type_id: s.fine_type_id,
              fine_type_name: s.fine_types?.name,
              count: 1
            });
          }
          return acc;
        }, []),
        plan_limit: business.business_subscription_plans?.max_fines_per_month,
        fines_remaining: business.business_subscription_plans?.max_fines_per_month 
          ? (business.business_subscription_plans.max_fines_per_month - currentMonth.fines_submitted)
          : 'Unlimited'
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
