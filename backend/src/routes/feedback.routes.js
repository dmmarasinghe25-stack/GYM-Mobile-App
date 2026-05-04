const express = require('express');
const router = express.Router();
const { getFeedbacks, createFeedback, markReviewed } = require('../controllers/feedback.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/', protect, getFeedbacks);
router.post('/', protect, createFeedback);
router.put('/:id/review', protect, markReviewed); // Admin route

module.exports = router;
