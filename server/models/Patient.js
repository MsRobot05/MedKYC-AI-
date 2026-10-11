const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // ---- Unique patient ID (like a UHID / ABHA-style ID) ----
  // Format: MKC-<YEAR>-<6 char alphanumeric>  e.g. MKC-2026-A3F9K2
  patientCode: { type: String, unique: true, index: true },

  dob: Date,
  bloodGroup: String,
  allergies: [String],
  medications: [String],
  pastSurgeries: [String],
  emergencyContactName: String,
  emergencyContactPhone: String,
  consent: {
    shareAllergies: { type: Boolean, default: true },
    shareHistory: { type: Boolean, default: true },
    shareMedications: { type: Boolean, default: true },
  },
}, { timestamps: true });

// ---------------------------------------------------------------
// Auto-generate a unique patientCode before saving, only once.
// ---------------------------------------------------------------
function generateRawCode() {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I — avoids confusion when read aloud
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `MKC-${year}-${code}`;
}

patientSchema.pre('save', async function (next) {
  if (!this.patientCode) {
    const Model = this.constructor;
    let candidate;
    let exists = true;

    while (exists) {
      candidate = generateRawCode();
      exists = await Model.exists({ patientCode: candidate });
    }
    this.patientCode = candidate;
  }
  next();
});

module.exports = mongoose.model('Patient', patientSchema);