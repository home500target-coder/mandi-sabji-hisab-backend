const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  brokerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Broker', required: true },
  vegetableName: { type: String, required: true }, // e.g. "Brinjal"
  date: { type: Date, default: Date.now },
  quantity: { type: Number, required: true }, // e.g. 12
  unit: { type: String, default: 'Kg' }, // 'Kg', 'Pouch', 'Crate', 'Bag'
  unitPrice: { type: Number, required: true }, // e.g. 20
  grossAmount: { type: Number, required: true }, // quantity * unitPrice
  
  deductions: {
    commissionAmount: { type: Number, default: 0 },
    laborCharges: { type: Number, default: 0 },
    mandiTax: { type: Number, default: 0 },
    otherDeductions: { type: Number, default: 0 }
  },
  
  netAmount: { type: Number, required: true }, // grossAmount - totalDeductions
  amountPaid: { type: Number, default: 0 }, // cash collected for this specific sale
  paymentStatus: { type: String, enum: ['Unpaid', 'Partial', 'Paid'], default: 'Unpaid' }
});

module.exports = mongoose.model('Sale', SaleSchema);
