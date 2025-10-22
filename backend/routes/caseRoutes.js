const express = require('express');
const router = express.Router();
const {
  createCase,
  getUserCases,
  getLawyerCases,
  getCaseById,
  updateCaseStatus,
  addDocument,
  rateLawyer
} = require('../controllers/caseController');
const { protect, authorize, checkQuota } = require('../middleware/auth');
const { uploadTicket, uploadDocument, handleUploadError } = require('../middleware/upload');

router.post('/', protect, checkQuota, uploadTicket, handleUploadError, createCase);
router.get('/', protect, getUserCases);
router.get('/lawyer', protect, authorize('lawyer', 'admin'), getLawyerCases);
router.get('/:id', protect, getCaseById);
router.put('/:id/status', protect, authorize('lawyer', 'admin'), updateCaseStatus);
router.post('/:id/documents', protect, uploadDocument, handleUploadError, addDocument);
router.post('/:id/rate', protect, authorize('user'), rateLawyer);

module.exports = router;
