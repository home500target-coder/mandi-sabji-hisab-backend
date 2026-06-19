const mongoose = require('mongoose');

const BrokerSchema = new mongoose.Schema({
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  mandiName: { type: String, required: true },
  phone: { type: String },
  defaultCommission: { type: Number, default: 6 }, // Typical percentage (e.g. 6%)
  outstandingDue: { type: Number, default: 0 }, // positive: broker owes money to farmer
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Broker', BrokerSchema);
