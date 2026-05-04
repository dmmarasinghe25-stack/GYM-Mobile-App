const Reminder = require('../models/Reminder');
const WorkoutLibraryItem = require('../models/WorkoutLibraryItem');

// -- REMINDERS --
exports.getReminders = async (req, res) => {
  try {
    const reminders = await Reminder.find({ user: req.user._id }).sort({ time: 1 });
    res.json(reminders);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.createReminder = async (req, res) => {
  try {
    const reminder = await Reminder.create({ ...req.body, user: req.user._id });
    res.status(201).json(reminder);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.updateReminderStatus = async (req, res) => {
  try {
    const reminder = await Reminder.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json(reminder);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.updateReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );
    if (!reminder) return res.status(404).json({ message: 'Not found' });
    res.json(reminder);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.deleteReminder = async (req, res) => {
  try {
    await Reminder.findByIdAndDelete(req.params.id);
    res.json({ message: 'Reminder deleted' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// -- WORKOUT LIBRARY --
exports.getLibrary = async (req, res) => {
  try {
    // Fetch both trainer-created library items and user's custom routines
    const items = await WorkoutLibraryItem.find({
      $or: [
        { isCustom: false },
        { isCustom: true, createdBy: req.user._id }
      ]
    }).populate('createdBy', 'name role');
    res.json(items);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.createLibraryItem = async (req, res) => {
  try {
    // If Admin/Trainer creates it, isCustom = false. If member creates it, isCustom = true.
    const isCustom = req.user.role === 'Member';
    const item = await WorkoutLibraryItem.create({ ...req.body, createdBy: req.user._id, isCustom });
    res.status(201).json(item);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.deleteLibraryItem = async (req, res) => {
  try {
    const item = await WorkoutLibraryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    
    // Only allow deletion if user owns it or is admin
    if (item.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    await WorkoutLibraryItem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};
