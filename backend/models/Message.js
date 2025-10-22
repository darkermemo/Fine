const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  type: {
    type: String,
    enum: ['text', 'image', 'document', 'system'],
    default: 'text'
  },
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    fileSize: Number
  }],
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
messageSchema.index({ caseId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, receiverId: 1 });

module.exports = mongoose.model('Message', messageSchema);
