const mongoose = require('mongoose');

const VegetableSchema = new mongoose.Schema({
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true } // e.g. "Baingan"
});

// Avoid duplicate vegetable names for the same farmer
VegetableSchema.index({ farmerId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Vegetable', VegetableSchema);
