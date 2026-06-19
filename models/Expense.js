const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, enum: ['Crop Investment', 'Personal Expense'], default: 'Crop Investment', required: true },
  vegetableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vegetable' }, // Reference to crop vegetable model
  title: { type: String, required: true }, // e.g. "Seeds", "Pohe", "Mobile Recharge"
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  note: { type: String }
});

module.exports = mongoose.model('Expense', ExpenseSchema);
