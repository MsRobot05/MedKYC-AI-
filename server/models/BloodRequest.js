const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bloodBank: { type: mongoose.Schema.Types.ObjectId, ref: 'BloodBank', required: true },
  bloodGroup: String,
  neededBy: Date,
  status: { type: String, enum: ['pending', 'confirmed'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);