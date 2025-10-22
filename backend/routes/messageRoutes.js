const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getCaseMessages,
  getUnreadCount,
  getConversations,
  markAsRead
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const { uploadDocument, handleUploadError } = require('../middleware/upload');

router.post('/', protect, uploadDocument, handleUploadError, sendMessage);
router.get('/conversations', protect, getConversations);
router.get('/unread/count', protect, getUnreadCount);
router.get('/:caseId', protect, getCaseMessages);
router.put('/:id/read', protect, markAsRead);

module.exports = router;
