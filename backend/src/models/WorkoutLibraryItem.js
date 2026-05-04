const mongoose = require('mongoose');

const workoutLibraryItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
  durationMinutes: { type: Number, required: true },
  category: { type: String, enum: ['Cardio', 'Strength', 'Flexibility', 'Yoga', 'Other'], default: 'Strength' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Can be Trainer or Member (for custom routines)
  isCustom: { type: Boolean, default: false } // True if member created it
}, { timestamps: true });

module.exports = mongoose.model('WorkoutLibraryItem', workoutLibraryItemSchema);
