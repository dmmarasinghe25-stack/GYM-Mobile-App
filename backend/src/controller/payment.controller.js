const Payment = require('../models/Payment');
const SessionBooking = require('../models/SessionBooking');
const mongoose = require('mongoose');

// Simulate sending OTP
exports.sendOTP = async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: 'Phone number is required' });
  // In a real app, integrate Twilio/Nexmo here.
  // For academic demo, we assume OTP is '1234'
  res.json({ message: `OTP sent successfully to ${phone}` });
};

// Simulate Payment processing
exports.processPayment = async (req, res) => {
  let { planId, amount, otp } = req.body;
  const userId = req.user._id;

  // Prevent BSONError by ensuring planId is a valid MongoDB ObjectId
  if (!planId || !mongoose.Types.ObjectId.isValid(planId)) {
    planId = '60d5ecb8b392d700153ee000'; // Safe fallback
  }

  if (otp !== '1234') {
    return res.status(400).json({ message: 'Invalid OTP' });
  }

  try {
    // Create Booking
    const booking = await SessionBooking.create({
      user: userId,
      plan: planId,
      status: 'Confirmed'
    });

    // Create Payment Record (Do NOT store card info)
    const payment = await Payment.create({
      booking: booking._id,
      user: userId,
      amount,
      status: 'Success'
    });

    res.status(201).json({ message: 'Payment successful', payment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const bookings = await SessionBooking.find({ user: req.user._id }).populate('plan');
    const payments = await Payment.find({ user: req.user._id }).populate('booking');
    res.json({ bookings, payments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const booking = await SessionBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.user.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized' });
    
    booking.status = 'Cancelled';
    await booking.save();
    
    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
