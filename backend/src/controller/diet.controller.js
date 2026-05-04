const FoodItem = require('../models/FoodItem');
const DietPlan = require('../models/DietPlan');
const ConsultationSlot = require('../models/ConsultationSlot');
const ConsultationBooking = require('../models/ConsultationBooking');
const Notification = require('../models/Notification');

// -- FOOD ITEMS --
exports.getFoodItems = async (req, res) => {
  try {
    const foods = await FoodItem.find();
    res.json(foods);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.createFoodItem = async (req, res) => {
  try {
    const food = await FoodItem.create(req.body);
    res.status(201).json(food);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// -- DIET PLANS --
exports.getDietPlans = async (req, res) => {
  try {
    const query = req.user.role === 'Dietitian' || req.user.role === 'Dietician' 
      ? { dietician: req.user._id } 
      : { member: req.user._id };
      
    const plans = await DietPlan.find(query).populate('member dietician', 'name');
    res.json(plans);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.createDietPlan = async (req, res) => {
  try {
    const plan = await DietPlan.create({ ...req.body, dietician: req.user._id });
    res.status(201).json(plan);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.updateDietPlan = async (req, res) => {
  try {
    const plan = await DietPlan.findOneAndUpdate(
      { _id: req.params.id, dietician: req.user._id }, 
      req.body, 
      { new: true }
    );
    if (!plan) return res.status(404).json({ message: 'Plan not found or unauthorized' });
    res.json(plan);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.deleteDietPlan = async (req, res) => {
  try {
    const plan = await DietPlan.findOneAndDelete({ _id: req.params.id, dietician: req.user._id });
    if (!plan) return res.status(404).json({ message: 'Plan not found or unauthorized' });
    res.json({ message: 'Plan deleted successfully' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// -- CONSULTATIONS --
exports.getSlots = async (req, res) => {
  try {
    const slots = await ConsultationSlot.find({ isBooked: false }).populate('dietician', 'name');
    res.json(slots);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.createSlot = async (req, res) => {
  try {
    const slot = await ConsultationSlot.create({ ...req.body, dietician: req.user._id });
    res.status(201).json(slot);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.bookConsultation = async (req, res) => {
  const { slotId, type } = req.body;
  try {
    const slot = await ConsultationSlot.findById(slotId);
    if (!slot || slot.isBooked) return res.status(400).json({ message: 'Slot unavailable' });

    slot.isBooked = true;
    await slot.save();

    const booking = await ConsultationBooking.create({
      member: req.user._id,
      slot: slotId,
      type
    });

    await Notification.create({
      user: slot.dietician,
      title: 'New Consultation Request',
      message: `You have a new ${type} request.`,
      type: 'Consultation'
    });

    res.status(201).json(booking);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getRequests = async (req, res) => {
  try {
    let requests;
    if (req.user.role === 'Dietitian' || req.user.role === 'Dietician') {
      const mySlots = await ConsultationSlot.find({ dietician: req.user._id });
      const slotIds = mySlots.map(s => s._id);
      requests = await ConsultationBooking.find({ slot: { $in: slotIds } })
        .populate('member', 'name email')
        .populate({ path: 'slot', populate: { path: 'dietician', select: 'name' } });
    } else {
      requests = await ConsultationBooking.find({ member: req.user._id })
        .populate('member', 'name email')
        .populate({ path: 'slot', populate: { path: 'dietician', select: 'name' } });
    }
    res.json(requests);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.updateRequestStatus = async (req, res) => {
  try {
    const updateData = { status: req.body.status };
    if (req.body.notes) {
      updateData.notes = req.body.notes;
    }

    const booking = await ConsultationBooking.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true }
    ).populate('slot');

    if (!booking) return res.status(404).json({ message: 'Request not found' });

    let message = `Your request was ${req.body.status}.`;
    if (req.body.status === 'Completed' && req.body.notes) {
      message += ' Check the notes for details.';
    }

    await Notification.create({
      user: booking.member,
      title: 'Consultation Update',
      message,
      type: 'Consultation'
    });

    res.json(booking);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
