const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const { protect } = require('../middleware/auth');

// @desc    Get all expenses logged by the farmer
// @route   GET /api/expenses
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const expenses = await Expense.find({ farmerId: req.user._id }).populate('vegetableId').sort({ date: -1 });
    return res.json(expenses);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// @desc    Record a new expense
// @route   POST /api/expenses
// @access  Private
router.post('/', protect, async (req, res) => {
  const { category, vegetableId, title, amount, date, note } = req.body;

  try {
    if (!category || !title || !amount) {
      return res.status(400).json({ message: 'Category, title, and amount are required' });
    }

    const numericAmount = Math.round(Number(amount) * 100) / 100;
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be a positive number' });
    }

    const expense = new Expense({
      farmerId: req.user._id,
      category,
      vegetableId: vegetableId || null,
      title,
      amount: numericAmount,
      date: date || Date.now(),
      note: note || ''
    });

    let createdExpense = await expense.save();
    if (createdExpense.vegetableId) {
      createdExpense = await createdExpense.populate('vegetableId');
    }
    return res.status(201).json(createdExpense);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
