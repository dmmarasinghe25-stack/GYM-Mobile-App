const mongoose = require('mongoose');
const feedbackSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coachId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional: If provided, it's coach feedback
  target: { type: String, enum: ['Trainer', 'Dietician', 'Service', 'Overall'], default: 'Overall' },
  rating: { type: Number, min: 1, max: 5 }, // Optional for system feedback
  message: { type: String, required: true },
  isReviewed: { type: Boolean, default: false }
}, { timestamps: true });
module.exports = mongoose.model('Feedback', feedbackSchema);