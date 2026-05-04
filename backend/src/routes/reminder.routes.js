const express = require('express');
const router = express.Router();
const { 
  getReminders, createReminder, updateReminderStatus, updateReminder, deleteReminder,
  getLibrary, createLibraryItem, deleteLibraryItem
} = require('../controllers/reminder.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/', protect, getReminders);
router.post('/', protect, createReminder);
router.put('/:id/status', protect, updateReminderStatus);
router.put('/:id', protect, updateReminder);
router.delete('/:id', protect, deleteReminder);

router.get('/library', protect, getLibrary);
router.post('/library', protect, createLibraryItem);
router.delete('/library/:id', protect, deleteLibraryItem);

module.exports = router;
