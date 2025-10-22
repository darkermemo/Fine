const { supabaseAdmin } = require('../config/supabase');

// @desc    Get user dashboard
// @route   GET /api/dashboard/user
// @access  Private
exports.getUserDashboard = async (req, res) => {
  try {
    const userId = req.user.profile.id;

    // Get cases stats
    const { data: cases } = await supabaseAdmin
      .from('cases')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    // Get payments stats
    const { data: payments } = await supabaseAdmin
      .from('payments')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    // Get invoices
    const { data: invoices } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('user_id', userId);

    // Calculate stats
    const totalSpent = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    const caseBreakdown = {
      total: cases.length,
      pending: cases.filter(c => c.status === 'pending').length,
      assigned: cases.filter(c => c.status === 'assigned').length,
      inProgress: cases.filter(c => c.status === 'in_progress').length,
      dismissed: cases.filter(c => c.status === 'dismissed').length,
      reduced: cases.filter(c => c.status === 'reduced').length
    };

    res.status(200).json({
      success: true,
      data: {
        totalCases: cases.length,
        totalSpent,
        caseBreakdown,
        recentCases: cases.slice(0, 5),
        recentPayments: payments.slice(0, 5),
        pendingInvoices: invoices.filter(i => i.status === 'draft').length
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
};

// @desc    Get lawyer dashboard
// @route   GET /api/dashboard/lawyer
// @access  Private
exports.getLawyerDashboard = async (req, res) => {
  try {
    const profileId = req.user.profile.id;

    // Get lawyer profile
    const { data: lawyerProfile } = await supabaseAdmin
      .from('lawyer_profiles')
      .select('*')
      .eq('profile_id', profileId)
      .single();

    if (!lawyerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Lawyer profile not found'
      });
    }

    // Get assigned cases
    const { data: cases } = await supabaseAdmin
      .from('cases')
      .select('*', { count: 'exact' })
      .eq('lawyer_id', lawyerProfile.id);

    // Get payments/earnings
    const { data: transactions } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('to_profile_id', profileId)
      .eq('status', 'completed');

    // Get completed payouts
    const completedPayouts = transactions
      .filter(t => t.lawyer_payout_status === 'completed')
      .reduce((sum, t) => sum + t.lawyer_payout_amount, 0);

    const pendingPayouts = transactions
      .filter(t => t.lawyer_payout_status === 'pending')
      .reduce((sum, t) => sum + t.lawyer_payout_amount, 0);

    const totalEarnings = completedPayouts + pendingPayouts;

    // Get invoices sent
    const { data: invoices } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('lawyer_id', lawyerProfile.id);

    const caseBreakdown = {
      total: cases.length,
      pending: cases.filter(c => c.status === 'pending').length,
      assigned: cases.filter(c => c.status === 'assigned').length,
      inProgress: cases.filter(c => c.status === 'in_progress').length,
      dismissed: cases.filter(c => c.status === 'dismissed').length,
      reduced: cases.filter(c => c.status === 'reduced').length
    };

    res.status(200).json({
      success: true,
      data: {
        lawyerProfile,
        totalCases: cases.length,
        caseBreakdown,
        earnings: {
          total: totalEarnings,
          completed: completedPayouts,
          pending: pendingPayouts
        },
        acceptanceRate: lawyerProfile.acceptance_rate,
        averageRating: lawyerProfile.average_rating,
        successfulCases: lawyerProfile.successful_cases,
        recentCases: cases.slice(0, 5),
        pendingInvoices: invoices.filter(i => i.status === 'draft').length
      }
    });

  } catch (error) {
    console.error('Lawyer dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching lawyer dashboard',
      error: error.message
    });
  }
};

// @desc    Get admin dashboard
// @route   GET /api/dashboard/admin
// @access  Private (admin only)
exports.getAdminDashboard = async (req, res) => {
  try {
    // Get all statistics
    const { data: allCases, count: totalCases } = await supabaseAdmin
      .from('cases')
      .select('*', { count: 'exact' });

    const { data: allPayments, count: totalPayments } = await supabaseAdmin
      .from('payments')
      .select('*', { count: 'exact' });

    const { data: allUsers, count: totalUsers } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact' });

    const { data: allTransactions } = await supabaseAdmin
      .from('transactions')
      .select('*');

    // Calculate metrics
    const totalRevenue = allPayments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalFees = allTransactions
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + (t.platform_fee || 0), 0);

    const caseSuccess = {
      dismissed: allCases.filter(c => c.status === 'dismissed').length,
      reduced: allCases.filter(c => c.status === 'reduced').length,
      lost: allCases.filter(c => c.status === 'lost').length
    };

    // Get user breakdown by role
    const { data: usersByRole } = await supabaseAdmin
      .from('profiles')
      .select('role_id, roles(name)', { count: 'exact' });

    const roleBreakdown = usersByRole.reduce((acc, user) => {
      const roleName = user.roles?.name || 'unknown';
      acc[roleName] = (acc[roleName] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        totals: {
          users: totalUsers,
          cases: totalCases,
          payments: totalPayments,
          transactions: allTransactions.length
        },
        financial: {
          totalRevenue,
          totalFees,
          averageTransactionSize: totalPayments > 0 ? totalRevenue / totalPayments : 0
        },
        caseMetrics: {
          ...caseSuccess,
          successRate: totalCases > 0 ? ((caseSuccess.dismissed + caseSuccess.reduced) / totalCases * 100).toFixed(2) + '%' : '0%'
        },
        roleBreakdown,
        recentCases: allCases.slice(0, 10),
        pendingPayouts: allTransactions
          .filter(t => t.lawyer_payout_status === 'pending')
          .reduce((sum, t) => sum + t.lawyer_payout_amount, 0)
      }
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin dashboard',
      error: error.message
    });
  }
};

// @desc    Get analytics metrics
// @route   GET /api/dashboard/analytics
// @access  Private (admin/support only)
exports.getAnalytics = async (req, res) => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;
    const userRole = req.user.profile.roles?.name;

    // Check authorization
    if (!['admin', 'business_support'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view analytics'
      });
    }

    // Get analytics data
    let query = supabaseAdmin
      .from('analytics')
      .select('*');

    if (startDate && endDate) {
      query = query
        .gte('date_recorded', startDate)
        .lte('date_recorded', endDate);
    }

    const { data: analytics } = await query;

    // Group by metric type
    const groupedMetrics = analytics.reduce((acc, item) => {
      if (!acc[item.metric_type]) {
        acc[item.metric_type] = [];
      }
      acc[item.metric_type].push({
        value: item.metric_value,
        date: item.date_recorded,
        period: item.period
      });
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        period,
        startDate,
        endDate,
        metrics: groupedMetrics
      }
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: error.message
    });
  }
};
