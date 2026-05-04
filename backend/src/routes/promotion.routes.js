const express = require('express');
const router = express.Router();
const { getPromotions, createPromotion, updatePromotion, deletePromotion } = require('../controllers/promotion.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/', protect, getPromotions);
// Only Admin can create, update, or delete promotions
router.post('/', protect, authorize('Admin'), createPromotion);
router.put('/:id', protect, authorize('Admin'), updatePromotion);
router.delete('/:id', protect, authorize('Admin'), deletePromotion);

module.exports = router;
