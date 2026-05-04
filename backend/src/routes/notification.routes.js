const express = require('express');
const router = express.Router();
const { 
  getNotifications, 
  getUnreadCount, 
  markAsRead, 
  markAllAsRead 
} = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/', protect, getNotifications);
router.get('/unread', protect, getUnreadCount);
router.put('/read-all', protect, markAllAsRead);
router.put('/:id/read', protect, markAsRead);

module.exports = router;
