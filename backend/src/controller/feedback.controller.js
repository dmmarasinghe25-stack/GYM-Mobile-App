const Feedback = require('../models/Feedback');
const User = require('../models/User');

exports.getFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .populate('user', 'name email')
      .populate('coachId', 'name email')
      .sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.createFeedback = async (req, res) => {
  const { coachId, message, rating, target } = req.body;

  try {
    let feedback;

    if (coachId) {
      // Coach specific feedback - Check for duplicate
      feedback = await Feedback.findOne({ user: req.user._id, coachId });
      
      if (feedback) {
        // Update existing feedback
        feedback.message = message;
        feedback.rating = rating;
        await feedback.save();
      } else {
        // Create new coach feedback
        feedback = await Feedback.create({
          user: req.user._id,
          coachId,
          target: 'Trainer',
          message,
          rating
        });
      }

      // Recalculate average rating for the coach
      const allCoachRatings = await Feedback.find({ coachId });
      const totalRatings = allCoachRatings.length;
      const sumRatings = allCoachRatings.reduce((sum, item) => sum + (item.rating || 0), 0);
      const averageRating = totalRatings > 0 ? (sumRatings / totalRatings).toFixed(1) : 0;

      await User.findByIdAndUpdate(coachId, {
        totalRatings,
        averageRating
      });

    } else {
      // General App feedback
      feedback = await Feedback.create({
        user: req.user._id,
        target: target || 'Overall',
        message,
        rating
      });
    }

    res.status(201).json(feedback);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.markReviewed = async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndUpdate(req.params.id, { isReviewed: true }, { new: true });
    res.json(feedback);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
