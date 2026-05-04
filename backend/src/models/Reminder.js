const mongoose = require('mongoose');
const reminderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  time: { type: Date, required: true },
  type: { type: String, enum: ['Workout', 'Meal', 'Water', 'Consultation', 'Custom', 'Other'], default: 'Custom' },
  status: { type: String, enum: ['Pending', 'Completed', 'Missed'], default: 'Pending' }
}, { timestamps: true });
module.exports = mongoose.model('Reminder', reminderSchema);