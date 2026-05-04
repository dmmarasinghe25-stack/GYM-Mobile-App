const express = require('express');
const router = express.Router();
const { getPlans, createPlan, updatePlan, deletePlan } = require('../controllers/plan.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/', getPlans); // Public to view plans
router.post('/', protect, authorize('Admin'), createPlan);
router.put('/:id', protect, authorize('Admin'), updatePlan);
router.delete('/:id', protect, authorize('Admin'), deletePlan);

module.exports = router;