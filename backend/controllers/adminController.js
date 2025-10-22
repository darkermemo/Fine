const User = require('../models/User');
const Lawyer = require('../models/Lawyer');
const Case = require('../models/Case');
const Payment = require('../models/Payment');

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private (Admin)
exports.getDashboardStats = async (req, res) => {
  try {
    // Get counts
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalLawyers = await Lawyer.countDocuments();
    const totalCases = await Case.countDocuments();
    const pendingApprovals = await Lawyer.countDocuments({ isApproved: false });

    // Get case statistics
    const caseStats = await Case.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get revenue statistics
    const revenueStats = await Payment.aggregate([
      {
        $match: { status: 'completed' }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          platformFees: { $sum: '$platformFee.amount' },
          lawyerPayouts: { $sum: '$lawyerPayout.amount' }
        }
      }
    ]);

    // Recent activities
    const recentCases = await Case.find()
      .sort('-createdAt')
      .limit(10)
      .populate('userId', 'firstName lastName email')
      .populate({
        path: 'lawyerId',
        populate: { path: 'userId', select: 'firstName lastName' }
      });

    const recentPayments = await Payment.find()
      .sort('-createdAt')
      .limit(10)
      .populate('userId', 'firstName lastName')
      .populate('caseId', 'caseNumber ticketDetails.violationType');

    // Success rate
    const outcomes = await Case.aggregate([
      {
        $match: { 'outcome.type': { $exists: true } }
      },
      {
        $group: {
          _id: '$outcome.type',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalLawyers,
          totalCases,
          pendingApprovals
        },
        caseStats,
        revenue: revenueStats[0] || { totalRevenue: 0, platformFees: 0, lawyerPayouts: 0 },
        outcomes,
        recentCases,
        recentPayments
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error.message
    });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { role: { $in: ['user', 'lawyer'] } };

    // Apply filters
    if (req.query.role) {
      query.role = req.query.role;
    }
    if (req.query.search) {
      query.$or = [
        { firstName: { $regex: req.query.search, $options: 'i' } },
        { lastName: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort('-createdAt');

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// @desc    Get pending lawyer applications
// @route   GET /api/admin/lawyers/pending
// @access  Private (Admin)
exports.getPendingLawyers = async (req, res) => {
  try {
    const pendingLawyers = await Lawyer.find({ isApproved: false })
      .populate('userId', 'firstName lastName email phone createdAt')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: pendingLawyers.length,
      data: pendingLawyers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pending lawyers',
      error: error.message
    });
  }
};

// @desc    Approve lawyer
// @route   PUT /api/admin/lawyers/:id/approve
// @access  Private (Admin)
exports.approveLawyer = async (req, res) => {
  try {
    const lawyer = await Lawyer.findById(req.params.id);

    if (!lawyer) {
      return res.status(404).json({
        success: false,
        message: 'Lawyer not found'
      });
    }

    lawyer.isApproved = true;
    lawyer.approvedBy = req.user.id;
    lawyer.approvedAt = new Date();
    
    await lawyer.save();

    // Update user role
    await User.findByIdAndUpdate(lawyer.userId, { role: 'lawyer' });

    // TODO: Send approval email

    res.status(200).json({
      success: true,
      message: 'Lawyer approved successfully',
      data: lawyer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error approving lawyer',
      error: error.message
    });
  }
};

// @desc    Reject lawyer
// @route   PUT /api/admin/lawyers/:id/reject
// @access  Private (Admin)
exports.rejectLawyer = async (req, res) => {
  try {
    const { reason } = req.body;
    const lawyer = await Lawyer.findById(req.params.id);

    if (!lawyer) {
      return res.status(404).json({
        success: false,
        message: 'Lawyer not found'
      });
    }

    lawyer.rejectionReason = reason;
    await lawyer.save();

    // TODO: Send rejection email

    res.status(200).json({
      success: true,
      message: 'Lawyer application rejected',
      data: lawyer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error rejecting lawyer',
      error: error.message
    });
  }
};

// @desc    Update user quota
// @route   PUT /api/admin/users/:id/quota
// @access  Private (Admin)
exports.updateUserQuota = async (req, res) => {
  try {
    const { casesPerMonth } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.quota.casesPerMonth = casesPerMonth;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User quota updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating quota',
      error: error.message
    });
  }
};

// @desc    Get all cases (Admin view)
// @route   GET /api/admin/cases
// @access  Private (Admin)
exports.getAllCases = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    // Apply filters
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.violationType) {
      query['ticketDetails.violationType'] = req.query.violationType;
    }
    if (req.query.state) {
      query['ticketDetails.location.state'] = req.query.state;
    }

    const cases = await Case.find(query)
      .populate('userId', 'firstName lastName email')
      .populate({
        path: 'lawyerId',
        populate: { path: 'userId', select: 'firstName lastName' }
      })
      .skip(skip)
      .limit(limit)
      .sort('-createdAt');

    const total = await Case.countDocuments(query);

    res.status(200).json({
      success: true,
      data: cases,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching cases',
      error: error.message
    });
  }
};

// @desc    Get all payments
// @route   GET /api/admin/payments
// @access  Private (Admin)
exports.getAllPayments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.status) {
      query.status = req.query.status;
    }

    const payments = await Payment.find(query)
      .populate('userId', 'firstName lastName email')
      .populate('caseId', 'caseNumber ticketDetails.violationType')
      .skip(skip)
      .limit(limit)
      .sort('-createdAt');

    const total = await Payment.countDocuments(query);

    res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payments',
      error: error.message
    });
  }
};

// @desc    Manually assign lawyer to case
// @route   PUT /api/admin/cases/:id/assign
// @access  Private (Admin)
exports.assignLawyerToCase = async (req, res) => {
  try {
    const { lawyerId } = req.body;
    const caseData = await Case.findById(req.params.id);

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    const lawyer = await Lawyer.findById(lawyerId);
    if (!lawyer) {
      return res.status(404).json({
        success: false,
        message: 'Lawyer not found'
      });
    }

    // Remove old lawyer if exists
    if (caseData.lawyerId) {
      const oldLawyer = await Lawyer.findById(caseData.lawyerId);
      if (oldLawyer) {
        oldLawyer.availability.currentCases -= 1;
        await oldLawyer.save();
      }
    }

    // Assign new lawyer
    caseData.lawyerId = lawyerId;
    caseData.status = 'assigned';
    await caseData.addTimelineEntry(
      'assigned',
      `Manually assigned to ${lawyer.userId.firstName} ${lawyer.userId.lastName}`,
      req.user.id
    );

    lawyer.availability.currentCases += 1;
    await lawyer.save();

    res.status(200).json({
      success: true,
      message: 'Lawyer assigned successfully',
      data: caseData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error assigning lawyer',
      error: error.message
    });
  }
};

// @desc    Delete user account
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has active cases
    const activeCases = await Case.countDocuments({
      userId: user._id,
      status: { $in: ['pending', 'assigned', 'in_progress', 'court_scheduled'] }
    });

    if (activeCases > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete user with active cases'
      });
    }

    await user.remove();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};
