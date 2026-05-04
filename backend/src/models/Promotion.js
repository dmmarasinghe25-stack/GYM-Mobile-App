const mongoose = require('mongoose');
const promotionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  imageUrl: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
module.exports = mongoose.model('Promotion', promotionSchema);