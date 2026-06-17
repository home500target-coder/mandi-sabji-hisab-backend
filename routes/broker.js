const express = require('express');
const router = express.Router();
const Broker = require('../models/Broker');
const { protect } = require('../middleware/auth');

// @desc    Get all brokers registered by the logged-in farmer
// @route   GET /api/brokers
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const brokers = await Broker.find({ farmerId: req.user._id }).sort({ name: 1 });
    return res.json(brokers);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// @desc    Create a new broker profile
// @route   POST /api/brokers
// @access  Private
router.post('/', protect, async (req, res) => {
  const { name, mandiName, phone, defaultCommission } = req.body;

  try {
    if (!name || !mandiName) {
      return res.status(400).json({ message: 'Please provide Broker name and Mandi name' });
    }

    const broker = new Broker({
      farmerId: req.user._id,
      name,
      mandiName,
      phone,
      defaultCommission: defaultCommission !== undefined ? defaultCommission : 6,
      outstandingDue: 0
    });

    const createdBroker = await broker.save();
    return res.status(201).json(createdBroker);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
