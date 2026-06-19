const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  brokerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Broker', required: true },
  saleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale' },
  billDate: { type: String }, // Format YYYY-MM-DD
  amountReceived: { type: Number, required: true }, // Net cash received
  
  // Deductions agreed upon during collective payout settlement
  deductions: {
    commissionAmount: { type: Number, default: 0 },
    laborCharges: { type: Number, default: 0 },
    mandiTax: { type: Number, default: 0 },
    otherDeductions: { type: Number, default: 0 }
  },
  
  paymentMethod: { type: String, enum: ['Cash', 'UPI', 'Bank Transfer'], required: true },
  date: { type: Date, default: Date.now },
  note: { type: String }
});

module.exports = mongoose.model('Payment', PaymentSchema);
