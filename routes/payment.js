const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Broker = require('../models/Broker');
const Sale = require('../models/Sale');
const { protect } = require('../middleware/auth');

// @desc    Get all payments received by the farmer
// @route   GET /api/payments
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const payments = await Payment.find({ farmerId: req.user._id })
      .populate('brokerId', 'name mandiName')
      .populate('saleId', 'vegetableName date quantity unit')
      .sort({ date: -1 });
    return res.json(payments);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// @desc    Record a payment received from a broker (supports collective deductions)
// @route   POST /api/payments
// @access  Private
router.post('/', protect, async (req, res) => {
  const { brokerId, saleId, billDate, amountReceived, deductions, paymentMethod, date, note } = req.body;

  try {
    if (!brokerId || !amountReceived || !paymentMethod) {
      return res.status(400).json({ message: 'Broker, amount received, and payment method are required' });
    }

    const broker = await Broker.findOne({ _id: brokerId, farmerId: req.user._id });
    if (!broker) {
      return res.status(404).json({ message: 'Broker not found' });
    }

    const amount = Number(amountReceived);
    if (amount <= 0) {
      return res.status(400).json({ message: 'Payment amount must be greater than zero' });
    }

    // Extract deductions values
    const commAmt = deductions && deductions.commissionAmount !== undefined ? Number(deductions.commissionAmount) : 0;
    const labor = deductions && deductions.laborCharges !== undefined ? Number(deductions.laborCharges) : 0;
    const tax = deductions && deductions.mandiTax !== undefined ? Number(deductions.mandiTax) : 0;
    const other = deductions && deductions.otherDeductions !== undefined ? Number(deductions.otherDeductions) : 0;

    const totalDeductions = commAmt + labor + tax + other;
    
    // Total debt cleared for the broker = Cash Paid + Expenses deducted
    const totalCredit = amount + totalDeductions;

    // 1. Case: Distribute payment across daily grouped portion sales
    if (billDate && !saleId) {
      const dateParts = billDate.split('-');
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1;
      const day = parseInt(dateParts[2], 10);

      const offsetMinutes = req.body.timezoneOffset ? Number(req.body.timezoneOffset) : 0;
      const localStart = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
      const localEnd = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
      const startOfDay = new Date(localStart.getTime() + (offsetMinutes * 60 * 1000));
      const endOfDay = new Date(localEnd.getTime() + (offsetMinutes * 60 * 1000));

      const salesToday = await Sale.find({
        farmerId: req.user._id,
        brokerId,
        date: { $gte: startOfDay, $lte: endOfDay }
      }).sort({ date: 1 });

      let amountLeft = totalCredit;
      for (const sale of salesToday) {
        if (amountLeft <= 0) break;

        const due = sale.netAmount - sale.amountPaid;
        if (due <= 0) continue;

        const payAmt = Math.min(amountLeft, due);
        sale.amountPaid += payAmt;
        
        if (sale.amountPaid >= (sale.netAmount - 0.01)) {
          sale.paymentStatus = 'Paid';
        } else {
          sale.paymentStatus = 'Partial';
        }
        await sale.save();
        amountLeft -= payAmt;
      }
    }

    // 2. Case: Update single portion sale
    if (saleId) {
      const sale = await Sale.findOne({ _id: saleId, farmerId: req.user._id });
      if (!sale) {
        return res.status(404).json({ message: 'Associated sale not found' });
      }

      sale.amountPaid += totalCredit;
      if (sale.amountPaid >= (sale.netAmount - 0.01)) {
        sale.paymentStatus = 'Paid';
      } else {
        sale.paymentStatus = 'Partial';
      }
      await sale.save();
    }

    const payment = new Payment({
      farmerId: req.user._id,
      brokerId,
      saleId: saleId || null,
      billDate: billDate || null,
      amountReceived: amount,
      deductions: {
        commissionAmount: commAmt,
        laborCharges: labor,
        mandiTax: tax,
        otherDeductions: other
      },
      paymentMethod,
      date: date || Date.now(),
      note: note || ''
    });

    const createdPayment = await payment.save();

    // Deduct totalCredit (amount + deductions) from broker ledger due balance
    broker.outstandingDue -= totalCredit;
    await broker.save();

    const populated = await createdPayment.populate([
      { path: 'brokerId', select: 'name mandiName' },
      { path: 'saleId', select: 'vegetableName date quantity unit' }
    ]);
    
    return res.status(201).json(populated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
