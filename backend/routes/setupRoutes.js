const express = require('express');
const router = express.Router();
const {
  initializeDatabase,
  getDatabaseStatus,
  getSetupInfo
} = require('../controllers/setupController');

// Setup endpoints (public access for first-time setup)
router.post('/initialize-db', initializeDatabase);
router.get('/db-status', getDatabaseStatus);
router.get('/info', getSetupInfo);

module.exports = router;
