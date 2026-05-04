const express = require('express');
const router = express.Router();
const { 
  getFoodItems, createFoodItem, 
  getDietPlans, createDietPlan, updateDietPlan, deleteDietPlan,
  getSlots, createSlot, bookConsultation,
  getRequests, updateRequestStatus
} = require('../controllers/diet.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Accessible by all authenticated users to view
router.get('/foods', protect, getFoodItems);

// Only Dietitians can create food items
router.post('/foods', protect, authorize('Dietitian', 'Dietician'), createFoodItem);

router.get('/plans', protect, getDietPlans);
// Only Dietitians can create, update, delete diet plans
router.post('/plans', protect, authorize('Dietitian', 'Dietician'), createDietPlan);
router.put('/plans/:id', protect, authorize('Dietitian', 'Dietician'), updateDietPlan);
router.delete('/plans/:id', protect, authorize('Dietitian', 'Dietician'), deleteDietPlan);

router.get('/slots', protect, getSlots);
// Only Dietitians can create slots
router.post('/slots', protect, authorize('Dietitian', 'Dietician'), createSlot);

// Members book consultations
router.post('/book', protect, authorize('Member'), bookConsultation);

// Dietitians manage requests
router.get('/requests', protect, authorize('Dietitian', 'Dietician'), getRequests);
router.put('/requests/:id', protect, authorize('Dietitian', 'Dietician'), updateRequestStatus);

module.exports = router;
