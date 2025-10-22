const express = require('express');
const router = express.Router();
const {
  getFineTypes,
  createFineType,
  updateFineType,
  getFeeStructure,
  setFeeStructure,
  getViolations,
  createViolation,
  getSettings,
  updateSetting,
  getAuditLog
} = require('../controllers/adminFinesController');
const { protectSupabase, checkRole } = require('../middleware/supabase-auth');

// Middleware: Ensure admin access
const adminOnly = checkRole(['admin']);

// Fine Types
router.get('/fine-types', protectSupabase, adminOnly, getFineTypes);
router.post('/fine-types', protectSupabase, adminOnly, createFineType);
router.put('/fine-types/:id', protectSupabase, adminOnly, updateFineType);

// Fee Structures
router.get('/fee-structures/:fineTypeId', protectSupabase, adminOnly, getFeeStructure);
router.post('/fee-structures', protectSupabase, adminOnly, setFeeStructure);

// Violations
router.get('/fine-violations/:fineTypeId', protectSupabase, adminOnly, getViolations);
router.post('/fine-violations', protectSupabase, adminOnly, createViolation);

// Admin Settings
router.get('/settings', protectSupabase, adminOnly, getSettings);
router.put('/settings/:settingKey', protectSupabase, adminOnly, updateSetting);

// Audit Log
router.get('/audit-log', protectSupabase, adminOnly, getAuditLog);

module.exports = router;
