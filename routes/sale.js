const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Broker = require('../models/Broker');
const { protect } = require('../middleware/auth');

// @desc    Get all sales registered by the logged-in farmer
// @route   GET /api/sales
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const sales = await Sale.find({ farmerId: req.user._id })
      .populate('brokerId', 'name mandiName')
      .sort({ date: -1 });
    return res.json(sales);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// @desc    Create a new sale transaction (logged at gross value without deductions)
// @route   POST /api/sales
// @access  Private
router.post('/', protect, async (req, res) => {
  const { brokerId, vegetableName, quantity, unit, unitPrice, date, isOverallSale } = req.body;

  try {
    if (!brokerId || !vegetableName || !quantity || !unitPrice) {
      return res.status(400).json({ message: 'Broker, vegetable, quantity, and unit price are required' });
    }

    const broker = await Broker.findOne({ _id: brokerId, farmerId: req.user._id });
    if (!broker) {
      return res.status(404).json({ message: 'Broker not found' });
    }

    const qty = Number(quantity);
    const price = Number(unitPrice);
    const grossAmount = Math.round(qty * price * 100) / 100;
    const netAmount = grossAmount; // Sales are logged at gross. Deductions are handled collectively at payout.

    const sale = new Sale({
      farmerId: req.user._id,
      brokerId,
      vegetableName,
      date: date || Date.now(),
      quantity: qty,
      unit: unit || 'Kg',
      unitPrice: price,
      grossAmount,
      deductions: {
        commissionAmount: 0,
        laborCharges: 0,
        mandiTax: 0,
        otherDeductions: 0
      },
      netAmount,
      amountPaid: 0,
      paymentStatus: 'Unpaid',
      isOverallSale: isOverallSale || false
    });

    const createdSale = await sale.save();

    // Increase broker's outstanding due balance
    broker.outstandingDue = Math.round((broker.outstandingDue + netAmount) * 100) / 100;
    await broker.save();

    const populated = await createdSale.populate('brokerId', 'name mandiName');
    return res.status(201).json(populated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
