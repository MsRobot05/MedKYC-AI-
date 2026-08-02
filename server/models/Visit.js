const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  diagnosis: String,
  prescription: [String],
  notes: String,
}, { timestamps: true });

module.exports = mongoose.model('Visit', visitSchema);