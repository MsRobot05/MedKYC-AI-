const mongoose = require('mongoose');

const accessLogSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    viewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // empty for public emergency scans
    viewerRole: { type: String, default: 'doctor' },
    action: { type: String, enum: ['viewed_record', 'added_visit', 'emergency_scan'], required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AccessLog', accessLogSchema);