const mongoose = require('mongoose');
const planSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. Gym, Yoga
  durationMonths: { type: Number, required: true },
  price: { type: Number, required: true },
  description: String
}, { timestamps: true });
module.exports = mongoose.model('Plan', planSchema);