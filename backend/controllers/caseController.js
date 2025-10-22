const Case = require('../models/Case');
const Lawyer = require('../models/Lawyer');
const User = require('../models/User');
const Payment = require('../models/Payment');

// Smart matching algorithm
const smartMatchLawyer = async (caseData) => {
  try {
    const { violationType, location, clientInfo } = caseData;

    // Find available lawyers in the jurisdiction
    const lawyers = await Lawyer.find({
      'isApproved': true,
      'availability.isAvailable': true,
      'jurisdictions.state': location.state,
      'specializations': violationType,
      $expr: { $lt: ['$availability.currentCases', '$availability.maxCases'] }
    }).populate('userId');

    if (lawyers.length === 0) {
      // Fallback: find any available lawyer in the state
      const fallbackLawyers = await Lawyer.find({
        'isApproved': true,
        'availability.isAvailable': true,
        'jurisdictions.state': location.state,
        $expr: { $lt: ['$availability.currentCases', '$availability.maxCases'] }
      }).populate('userId');

      if (fallbackLawyers.length === 0) {
        return null;
      }
      
      lawyers.push(...fallbackLawyers);
    }

    // Calculate matching scores
    const scoredLawyers = lawyers.map(lawyer => {
      let score = 0;

      // Specialization match (40 points)
      if (lawyer.specializations.includes(violationType)) {
        score += 40;
      }

      // Success rate (30 points)
      score += (lawyer.statistics.successRate / 100) * 30;

      // Experience (15 points)
      score += Math.min(lawyer.yearsOfExperience / 20 * 15, 15);

      // Rating (10 points)
      score += (lawyer.rating.average / 5) * 10;

      // Availability (5 points)
      const capacityRatio = lawyer.availability.currentCases / lawyer.availability.maxCases;
      score += (1 - capacityRatio) * 5;

      // CDL bonus if applicable
      if (clientInfo.isCDLDriver && lawyer.specializations.includes('cdl_violations')) {
        score += 10;
      }

      return {
        lawyer,
        score
      };
    });

    // Sort by score and return top match
    scoredLawyers.sort((a, b) => b.score - a.score);
    
    return scoredLawyers[0] ? {
      lawyer: scoredLawyers[0].lawyer,
      score: scoredLawyers[0].score
    } : null;
  } catch (error) {
    console.error('Error in smart matching:', error);
    return null;
  }
};

// @desc    Create new case
// @route   POST /api/cases
// @access  Private
exports.createCase = async (req, res) => {
  try {
    const userId = req.user.id;
    const caseData = req.body;

    // Check user quota
    const user = await User.findById(userId);
    await user.resetMonthlyQuota();

    if (user.quota.casesUsed >= user.quota.casesPerMonth) {
      return res.status(403).json({
        success: false,
        message: 'Monthly case quota exceeded'
      });
    }

    // Handle file upload
    if (req.file) {
      caseData.ticketDetails.ticketImage = `/uploads/tickets/${req.file.filename}`;
    }

    // Calculate pricing
    let quotedPrice = 249;
    if (caseData.ticketDetails.violationType === 'dui') {
      quotedPrice = 499;
    } else if (caseData.ticketDetails.violationType === 'reckless_driving') {
      quotedPrice = 349;
    } else if (caseData.clientInfo.isCDLDriver) {
      quotedPrice = 299;
    }

    // Create case
    const newCase = await Case.create({
      userId,
      ticketDetails: caseData.ticketDetails,
      clientInfo: caseData.clientInfo,
      pricing: {
        quotedPrice
      },
      timeline: [{
        status: 'pending',
        note: 'Case submitted successfully',
        updatedBy: userId
      }]
    });

    // Smart match with lawyer
    const match = await smartMatchLawyer({
      violationType: caseData.ticketDetails.violationType,
      location: caseData.ticketDetails.location,
      clientInfo: caseData.clientInfo
    });

    if (match) {
      newCase.lawyerId = match.lawyer._id;
      newCase.assignmentScore = match.score;
      newCase.status = 'assigned';
      newCase.timeline.push({
        status: 'assigned',
        note: `Matched with ${match.lawyer.userId.firstName} ${match.lawyer.userId.lastName}`,
        updatedBy: userId
      });

      // Update lawyer's current cases
      match.lawyer.availability.currentCases += 1;
      await match.lawyer.save();

      await newCase.save();
    }

    // Update user quota
    user.quota.casesUsed += 1;
    await user.save();

    // Populate for response
    const populatedCase = await Case.findById(newCase._id)
      .populate('userId', 'firstName lastName email phone')
      .populate({
        path: 'lawyerId',
        populate: { path: 'userId', select: 'firstName lastName email phone' }
      });

    res.status(201).json({
      success: true,
      message: 'Case created successfully',
      data: populatedCase
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating case',
      error: error.message
    });
  }
};

// @desc    Get all user cases
// @route   GET /api/cases
// @access  Private
exports.getUserCases = async (req, res) => {
  try {
    const cases = await Case.find({ userId: req.user.id })
      .populate({
        path: 'lawyerId',
        populate: { path: 'userId', select: 'firstName lastName email phone profileImage' }
      })
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: cases.length,
      data: cases
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching cases',
      error: error.message
    });
  }
};

// @desc    Get lawyer cases
// @route   GET /api/cases/lawyer
// @access  Private (Lawyer)
exports.getLawyerCases = async (req, res) => {
  try {
    const lawyer = await Lawyer.findOne({ userId: req.user.id });
    
    if (!lawyer) {
      return res.status(404).json({
        success: false,
        message: 'Lawyer profile not found'
      });
    }

    const cases = await Case.find({ lawyerId: lawyer._id })
      .populate('userId', 'firstName lastName email phone profileImage')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: cases.length,
      data: cases
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching cases',
      error: error.message
    });
  }
};

// @desc    Get case by ID
// @route   GET /api/cases/:id
// @access  Private
exports.getCaseById = async (req, res) => {
  try {
    const caseData = await Case.findById(req.params.id)
      .populate('userId', 'firstName lastName email phone profileImage')
      .populate({
        path: 'lawyerId',
        populate: { path: 'userId', select: 'firstName lastName email phone profileImage' }
      });

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Check authorization
    const isOwner = caseData.userId._id.toString() === req.user.id;
    const lawyer = await Lawyer.findOne({ userId: req.user.id });
    const isLawyer = lawyer && caseData.lawyerId && 
                     caseData.lawyerId._id.toString() === lawyer._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isLawyer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this case'
      });
    }

    res.status(200).json({
      success: true,
      data: caseData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching case',
      error: error.message
    });
  }
};

// @desc    Update case status
// @route   PUT /api/cases/:id/status
// @access  Private (Lawyer/Admin)
exports.updateCaseStatus = async (req, res) => {
  try {
    const { status, note, courtDate, outcome } = req.body;

    const caseData = await Case.findById(req.params.id);

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Update status
    await caseData.addTimelineEntry(status, note, req.user.id);

    if (courtDate) {
      caseData.courtDate = courtDate;
    }

    if (outcome) {
      caseData.outcome = outcome;

      // Update lawyer statistics
      if (caseData.lawyerId) {
        const lawyer = await Lawyer.findById(caseData.lawyerId);
        
        if (outcome.type === 'dismissed') {
          lawyer.statistics.casesDismissed += 1;
        } else if (outcome.type === 'reduced') {
          lawyer.statistics.casesReduced += 1;
        }
        
        lawyer.statistics.totalCases += 1;
        lawyer.calculateSuccessRate();
        await lawyer.save();
      }

      // Handle refund if case lost
      if (outcome.type === 'guilty' && caseData.payment.status === 'paid') {
        // TODO: Process refund
      }
    }

    await caseData.save();

    res.status(200).json({
      success: true,
      message: 'Case updated successfully',
      data: caseData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating case',
      error: error.message
    });
  }
};

// @desc    Add document to case
// @route   POST /api/cases/:id/documents
// @access  Private
exports.addDocument = async (req, res) => {
  try {
    const caseData = await Case.findById(req.params.id);

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    if (req.file) {
      caseData.documents.push({
        name: req.body.name || req.file.originalname,
        type: req.file.mimetype,
        url: `/uploads/documents/${req.file.filename}`,
        uploadedBy: req.user.id
      });

      await caseData.save();
    }

    res.status(200).json({
      success: true,
      message: 'Document added successfully',
      data: caseData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding document',
      error: error.message
    });
  }
};

// @desc    Rate lawyer
// @route   POST /api/cases/:id/rate
// @access  Private
exports.rateLawyer = async (req, res) => {
  try {
    const { rating, review } = req.body;
    const caseData = await Case.findById(req.params.id);

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    if (caseData.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (caseData.clientRating.rating) {
      return res.status(400).json({
        success: false,
        message: 'Case already rated'
      });
    }

    caseData.clientRating = {
      rating,
      review,
      ratedAt: new Date()
    };

    await caseData.save();

    // Update lawyer rating
    if (caseData.lawyerId) {
      const lawyer = await Lawyer.findById(caseData.lawyerId);
      await lawyer.updateRating(rating);
    }

    res.status(200).json({
      success: true,
      message: 'Rating submitted successfully',
      data: caseData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error submitting rating',
      error: error.message
    });
  }
};
