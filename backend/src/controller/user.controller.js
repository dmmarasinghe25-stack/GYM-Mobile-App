const User = require('../models/User');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMembers = async (req, res) => {
  try {
    const members = await User.find({ role: 'Member' }).select('name email');
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTrainers = async (req, res) => {
  try {
    const trainers = await User.find({ role: 'Trainer' }).select('name email');
    res.json(trainers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
