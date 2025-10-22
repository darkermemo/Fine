const Message = require('../models/Message');
const Case = require('../models/Case');

// @desc    Send message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { caseId, receiverId, content, type } = req.body;

    // Verify case exists and user has access
    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Check authorization
    const isAuthorized = 
      caseData.userId.toString() === req.user.id ||
      (caseData.lawyerId && caseData.lawyerId.toString() === receiverId) ||
      req.user.role === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send messages for this case'
      });
    }

    // Handle attachments if any
    const attachments = [];
    if (req.file) {
      attachments.push({
        fileName: req.file.originalname,
        fileUrl: `/uploads/documents/${req.file.filename}`,
        fileType: req.file.mimetype,
        fileSize: req.file.size
      });
    }

    // Create message
    const message = await Message.create({
      caseId,
      senderId: req.user.id,
      receiverId,
      content,
      type: type || 'text',
      attachments
    });

    // Populate sender and receiver info
    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'firstName lastName profileImage role')
      .populate('receiverId', 'firstName lastName profileImage role');

    // TODO: Emit socket event for real-time delivery
    // io.to(receiverId).emit('newMessage', populatedMessage);

    res.status(201).json({
      success: true,
      data: populatedMessage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message
    });
  }
};

// @desc    Get messages for a case
// @route   GET /api/messages/:caseId
// @access  Private
exports.getCaseMessages = async (req, res) => {
  try {
    const { caseId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Verify case access
    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Check authorization
    const isAuthorized = 
      caseData.userId.toString() === req.user.id ||
      (caseData.lawyerId && caseData.lawyerId.userId.toString() === req.user.id) ||
      req.user.role === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view messages for this case'
      });
    }

    // Get messages
    const messages = await Message.find({ caseId })
      .populate('senderId', 'firstName lastName profileImage role')
      .populate('receiverId', 'firstName lastName profileImage role')
      .sort('createdAt')
      .skip(skip)
      .limit(limit);

    // Mark messages as read
    await Message.updateMany(
      {
        caseId,
        receiverId: req.user.id,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    const total = await Message.countDocuments({ caseId });

    res.status(200).json({
      success: true,
      data: messages,
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
      message: 'Error fetching messages',
      error: error.message
    });
  }
};

// @desc    Get unread message count
// @route   GET /api/messages/unread/count
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiverId: req.user.id,
      isRead: false
    });

    res.status(200).json({
      success: true,
      data: { count }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching unread count',
      error: error.message
    });
  }
};

// @desc    Get all conversations for user
// @route   GET /api/messages/conversations
// @access  Private
exports.getConversations = async (req, res) => {
  try {
    // Get all unique case IDs where user is involved
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: req.user.id },
            { receiverId: req.user.id }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$caseId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiverId', req.user.id] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    // Populate case and user details
    const conversations = await Promise.all(
      messages.map(async (msg) => {
        const caseData = await Case.findById(msg._id)
          .populate('userId', 'firstName lastName profileImage')
          .populate({
            path: 'lawyerId',
            populate: { path: 'userId', select: 'firstName lastName profileImage' }
          });

        const lastMessage = await Message.findById(msg.lastMessage._id)
          .populate('senderId', 'firstName lastName')
          .populate('receiverId', 'firstName lastName');

        return {
          case: caseData,
          lastMessage,
          unreadCount: msg.unreadCount
        };
      })
    );

    res.status(200).json({
      success: true,
      data: conversations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching conversations',
      error: error.message
    });
  }
};

// @desc    Mark message as read
// @route   PUT /api/messages/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (message.receiverId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    message.isRead = true;
    message.readAt = new Date();
    await message.save();

    res.status(200).json({
      success: true,
      data: message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking message as read',
      error: error.message
    });
  }
};
