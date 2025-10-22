const Lawyer = require('../models/Lawyer');
const User = require('../models/User');
const Case = require('../models/Case');

// @desc    Register as lawyer
// @route   POST /api/lawyers/register
// @access  Private
exports.registerLawyer = async (req, res) => {
  try {
    const {
      licenseNumber,
      barAssociation,
      yearsOfExperience,
      specializations,
      jurisdictions,
      bio,
      pricing,
      bankDetails
    } = req.body;

    // Check if user already has a lawyer profile
    const existingLawyer = await Lawyer.findOne({ userId: req.user.id });
    if (existingLawyer) {
      return res.status(400).json({
        success: false,
        message: 'Lawyer profile already exists'
      });
    }

    // Check if license number already exists
    const licenseExists = await Lawyer.findOne({ licenseNumber });
    if (licenseExists) {
      return res.status(400).json({
        success: false,
        message: 'License number already registered'
      });
    }

    // Handle document uploads
    const documents = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        documents.push({
          type: file.fieldname === 'license' ? 'license' : 'other',
          url: `/uploads/licenses/${file.filename}`,
          uploadedAt: new Date()
        });
      });
    }

    // Create lawyer profile
    const lawyer = await Lawyer.create({
      userId: req.user.id,
      licenseNumber,
      barAssociation,
      yearsOfExperience,
      specializations,
      jurisdictions,
      bio,
      pricing,
      bankDetails,
      documents
    });

    // TODO: Send notification to admin for approval

    res.status(201).json({
      success: true,
      message: 'Lawyer application submitted successfully. Awaiting admin approval.',
      data: lawyer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error registering lawyer',
      error: error.message
    });
  }
};

// @desc    Get lawyer profile
// @route   GET /api/lawyers/profile
// @access  Private (Lawyer)
exports.getLawyerProfile = async (req, res) => {
  try {
    const lawyer = await Lawyer.findOne({ userId: req.user.id })
      .populate('userId', 'firstName lastName email phone profileImage');

    if (!lawyer) {
      return res.status(404).json({
        success: false,
        message: 'Lawyer profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: lawyer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching lawyer profile',
      error: error.message
    });
  }
};

// @desc    Update lawyer profile
// @route   PUT /api/lawyers/profile
// @access  Private (Lawyer)
exports.updateLawyerProfile = async (req, res) => {
  try {
    const lawyer = await Lawyer.findOne({ userId: req.user.id });

    if (!lawyer) {
      return res.status(404).json({
        success: false,
        message: 'Lawyer profile not found'
      });
    }

    // Update allowed fields
    const allowedFields = [
      'bio', 
      'specializations', 
      'jurisdictions', 
      'pricing', 
      'bankDetails',
      'availability'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        lawyer[field] = req.body[field];
      }
    });

    await lawyer.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: lawyer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// @desc    Get lawyer statistics
// @route   GET /api/lawyers/statistics
// @access  Private (Lawyer)
exports.getLawyerStatistics = async (req, res) => {
  try {
    const lawyer = await Lawyer.findOne({ userId: req.user.id });

    if (!lawyer) {
      return res.status(404).json({
        success: false,
        message: 'Lawyer profile not found'
      });
    }

    // Get detailed case statistics
    const cases = await Case.find({ lawyerId: lawyer._id });

    // Calculate monthly statistics
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyCases = cases.filter(c => {
      const caseDate = new Date(c.createdAt);
      return caseDate.getMonth() === currentMonth && 
             caseDate.getFullYear() === currentYear;
    });

    // Calculate earnings
    const totalEarnings = cases
      .filter(c => c.payment.status === 'paid')
      .reduce((sum, c) => sum + (c.pricing.actualPrice || c.pricing.quotedPrice), 0);

    const monthlyEarnings = monthlyCases
      .filter(c => c.payment.status === 'paid')
      .reduce((sum, c) => sum + (c.pricing.actualPrice || c.pricing.quotedPrice), 0);

    // Platform fee (20%)
    const netEarnings = totalEarnings * 0.8;
    const monthlyNetEarnings = monthlyEarnings * 0.8;

    // Case distribution by type
    const casesByType = {};
    cases.forEach(c => {
      const type = c.ticketDetails.violationType;
      casesByType[type] = (casesByType[type] || 0) + 1;
    });

    // Recent reviews
    const recentReviews = cases
      .filter(c => c.clientRating && c.clientRating.rating)
      .sort((a, b) => new Date(b.clientRating.ratedAt) - new Date(a.clientRating.ratedAt))
      .slice(0, 5)
      .map(c => ({
        caseNumber: c.caseNumber,
        rating: c.clientRating.rating,
        review: c.clientRating.review,
        date: c.clientRating.ratedAt
      }));

    res.status(200).json({
      success: true,
      data: {
        profile: {
          rating: lawyer.rating,
          successRate: lawyer.statistics.successRate,
          totalCases: lawyer.statistics.totalCases
        },
        cases: {
          total: cases.length,
          active: cases.filter(c => ['assigned', 'in_progress', 'court_scheduled'].includes(c.status)).length,
          pending: cases.filter(c => c.status === 'pending').length,
          completed: cases.filter(c => ['dismissed', 'reduced', 'lost', 'closed'].includes(c.status)).length,
          monthly: monthlyCases.length,
          byType: casesByType
        },
        earnings: {
          total: totalEarnings,
          net: netEarnings,
          monthly: monthlyEarnings,
          monthlyNet: monthlyNetEarnings,
          platformFee: totalEarnings * 0.2
        },
        outcomes: {
          won: lawyer.statistics.casesWon,
          dismissed: lawyer.statistics.casesDismissed,
          reduced: lawyer.statistics.casesReduced,
          successRate: lawyer.statistics.successRate
        },
        recentReviews
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};

// @desc    Toggle availability
// @route   PUT /api/lawyers/availability
// @access  Private (Lawyer)
exports.toggleAvailability = async (req, res) => {
  try {
    const lawyer = await Lawyer.findOne({ userId: req.user.id });

    if (!lawyer) {
      return res.status(404).json({
        success: false,
        message: 'Lawyer profile not found'
      });
    }

    lawyer.availability.isAvailable = !lawyer.availability.isAvailable;
    await lawyer.save();

    res.status(200).json({
      success: true,
      message: `Availability ${lawyer.availability.isAvailable ? 'enabled' : 'disabled'}`,
      data: {
        isAvailable: lawyer.availability.isAvailable
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating availability',
      error: error.message
    });
  }
};

// @desc    Get public lawyer profile
// @route   GET /api/lawyers/:id
// @access  Public
exports.getPublicLawyerProfile = async (req, res) => {
  try {
    const lawyer = await Lawyer.findById(req.params.id)
      .populate('userId', 'firstName lastName profileImage');

    if (!lawyer || !lawyer.isApproved) {
      return res.status(404).json({
        success: false,
        message: 'Lawyer not found'
      });
    }

    // Get recent reviews
    const cases = await Case.find({ 
      lawyerId: lawyer._id,
      'clientRating.rating': { $exists: true }
    })
      .select('clientRating')
      .sort('-clientRating.ratedAt')
      .limit(10);

    const reviews = cases.map(c => c.clientRating);

    res.status(200).json({
      success: true,
      data: {
        ...lawyer.toObject(),
        bankDetails: undefined, // Hide sensitive info
        reviews
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching lawyer profile',
      error: error.message
    });
  }
};

// @desc    Search lawyers
// @route   GET /api/lawyers/search
// @access  Public
exports.searchLawyers = async (req, res) => {
  try {
    const { state, specialization, minRating, sortBy } = req.query;

    const query = { isApproved: true };

    if (state) {
      query['jurisdictions.state'] = state;
    }

    if (specialization) {
      query.specializations = specialization;
    }

    if (minRating) {
      query['rating.average'] = { $gte: parseFloat(minRating) };
    }

    let sort = '-rating.average';
    if (sortBy === 'experience') {
      sort = '-yearsOfExperience';
    } else if (sortBy === 'success') {
      sort = '-statistics.successRate';
    }

    const lawyers = await Lawyer.find(query)
      .populate('userId', 'firstName lastName profileImage')
      .sort(sort)
      .limit(20);

    res.status(200).json({
      success: true,
      count: lawyers.length,
      data: lawyers.map(lawyer => ({
        ...lawyer.toObject(),
        bankDetails: undefined // Hide sensitive info
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching lawyers',
      error: error.message
    });
  }
};
