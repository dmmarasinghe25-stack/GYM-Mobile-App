const Promotion = require('../models/Promotion');

exports.getPromotions = async (req, res) => {
  try {
    const isAdmin = req.user && req.user.role === 'Admin';
    let query = { isActive: true };

    if (!isAdmin) {
      // Regular users only see active promotions where current date is between start and end
      const now = new Date();
      query.startDate = { $lte: now };
      query.endDate = { $gte: now };
    }

    const promotions = await Promotion.find(query).sort({ createdAt: -1 });
    res.json(promotions);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.createPromotion = async (req, res) => {
  try {
    const promotion = await Promotion.create(req.body);
    res.status(201).json(promotion);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.updatePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!promotion) return res.status(404).json({ message: 'Not found' });
    res.json(promotion);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.deletePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findByIdAndDelete(req.params.id);
    if (!promotion) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Promotion deleted' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};
