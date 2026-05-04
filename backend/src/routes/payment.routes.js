const express = require('express');
const router = express.Router();
const { sendOTP, processPayment, getHistory, cancelBooking } = require('../controllers/payment.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/otp', protect, sendOTP);
router.post('/process', protect, processPayment);
router.get('/history', protect, getHistory);
router.put('/cancel/:id', protect, cancelBooking);

module.exports = router;
