const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getStats,
  getAreaInsights,
  getAreas,
} = require('../controllers/analyticsController');

// Overall stats (accessible to authenticated users for dashboards)
router.get('/stats', auth, getStats);

// Area insights
router.get('/area/:area', auth, getAreaInsights);

// All distinct areas
router.get('/areas', auth, getAreas);

module.exports = router;
