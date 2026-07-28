const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dob: Date,
  bloodGroup: String,
  allergies: [String],        // structured array, not free text
  medications: [String],
  pastSurgeries: [String],
  emergencyContactName: String,
  emergencyContactPhone: String,
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);