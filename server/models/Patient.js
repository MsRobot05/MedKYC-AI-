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
    // Public emergency QR. Off by default; the patient has to turn it on.
    emergency: {
      enabled: { type: Boolean, default: false },
      token: { type: String },
    },
  },
  { timestamps: true }
);

patientSchema.index(
  { 'emergency.token': 1 },
  { unique: true, partialFilterExpression: { 'emergency.token': { $type: 'string' } } }
);

module.exports = mongoose.model('Patient', patientSchema);