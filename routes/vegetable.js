const express = require('express');
const router = express.Router();
const Vegetable = require('../models/Vegetable');
const { protect } = require('../middleware/auth');

// @desc    Get all vegetables registered by the logged-in farmer
// @route   GET /api/vegetables
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const vegetables = await Vegetable.find({ farmerId: req.user._id }).sort({ name: 1 });
    return res.json(vegetables);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// @desc    Add a new vegetable crop to the farmer's master list
// @route   POST /api/vegetables
// @access  Private
router.post('/', protect, async (req, res) => {
  const { name } = req.body;

  try {
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Vegetable name is required' });
    }

    const trimmedName = name.trim();

    // Check for duplicate crop name under this farmer
    const exists = await Vegetable.findOne({ farmerId: req.user._id, name: trimmedName });
    if (exists) {
      return res.status(400).json({ message: 'This vegetable is already in your list' });
    }

    const vegetable = new Vegetable({
      farmerId: req.user._id,
      name: trimmedName
    });

    const created = await vegetable.save();
    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
