const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['patient', 'doctor', 'parent', 'admin'], default: 'patient' },

  // ---- Parent/guardian linking (account-level relationship, stays here) ----
  guardianOf: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // ---- Emergency QR access (security/versioning, stays here) ----
  emergencyTokenVersion: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);