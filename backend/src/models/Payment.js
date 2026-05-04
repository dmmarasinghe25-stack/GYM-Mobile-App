const mongoose = require('mongoose');
const paymentSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'SessionBooking', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['Success', 'Failed'], default: 'Success' },
  paymentDate: { type: Date, default: Date.now }
}, { timestamps: true });
module.exports = mongoose.model('Payment', paymentSchema);