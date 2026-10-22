const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    reason: { type: String, default: '', maxlength: 300 },
    status: { type: String, enum: ['requested', 'confirmed', 'completed', 'cancelled'], default: 'requested' },
    active: { type: Boolean, default: true }, // false once cancelled, which frees the slot
  },
  { timestamps: true }
);

// The database itself refuses two live bookings for the same doctor and time.
appointmentSchema.index({ doctor: 1, date: 1 }, { unique: true, partialFilterExpression: { active: true } });

module.exports = mongoose.model('Appointment', appointmentSchema);