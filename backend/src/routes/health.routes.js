const express = require('express');
const router = express.Router();
const { createAssessment, getAssessments, getProgress, generateReport } = require('../controllers/health.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/', protect, createAssessment);
router.get('/', protect, getAssessments);
router.get('/progress', protect, getProgress);
router.get('/report', protect, generateReport);

module.exports = router;