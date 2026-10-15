const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dob: Date,
    gender: { type: String, enum: ['', 'female', 'male', 'other', 'prefer_not_to_say'], default: '' },
    phone: { type: String, default: '' },
    city: { type: String, default: '' },
    abhaNumber: { type: String, default: '' },
    bloodGroup: { type: String, default: '' },
    allergies: [String],
    medications: [String],
    pastSurgeries: [String],
    emergencyContactName: { type: String, default: '' },
    emergencyContactPhone: { type: String, default: '' },
    consent: {
      shareAllergies: { type: Boolean, default: true },
      shareHistory: { type: Boolean, default: true },
      shareMedications: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Patient', patientSchema);