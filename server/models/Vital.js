const mongoose = require('mongoose');

const vitalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['bp', 'sugar', 'pulse', 'spo2', 'weight'], required: true },
    value: { type: Number, required: true }, // systolic for blood pressure
    value2: { type: Number },                // diastolic
    context: { type: String, enum: ['fasting', 'after_meal'] }, // sugar only
    note: { type: String, default: '', maxlength: 200 },
    measuredAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

vitalSchema.index({ user: 1, type: 1, measuredAt: -1 });

module.exports = mongoose.model('Vital', vitalSchema);