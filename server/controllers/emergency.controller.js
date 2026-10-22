const crypto = require('crypto');
const Patient = require('../models/Patient');
const User = require('../models/User');
const AccessLog = require('../models/AccessLog');

const newToken = () => crypto.randomBytes(18).toString('base64url'); // 24 unguessable characters
const SCAN_DEDUPE_MS = 5 * 60 * 1000;
const NOT_ACTIVE = { message: 'This emergency link is not active' };

function ageFrom(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
}

// ---------- Patient-facing settings (logged in) ----------
exports.getSettings = async (req, res) => {
  try {
    const p = await Patient.findOne({ user: req.user.id }).select('emergency').lean();
    if (!p) return res.json({ hasKyc: false, enabled: false, token: null });
    res.json({ hasKyc: true, enabled: !!p.emergency?.enabled, token: p.emergency?.token || null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user.id });
    if (!patient) return res.status(400).json({ message: 'Fill in and save your KYC first' });

    const { enabled, regenerate } = req.body;
    const set = {};
    if (typeof enabled === 'boolean') set['emergency.enabled'] = enabled;
    // A token is made the first time, or when the patient asks for a new one (which kills the old QR).
    if (regenerate === true || (enabled === true && !patient.emergency?.token)) {
      set['emergency.token'] = newToken();
    }
    if (!Object.keys(set).length) return res.status(400).json({ message: 'Nothing to change' });

    const updated = await Patient.findOneAndUpdate({ user: req.user.id }, { $set: set }, { new: true })
      .select('emergency')
      .lean();
    res.json({ hasKyc: true, enabled: !!updated.emergency?.enabled, token: updated.emergency?.token || null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------- Public page (no login) ----------
exports.publicView = async (req, res) => {
  try {
    const token = String(req.params.token || '');
    if (token.length < 16 || token.length > 64) return res.status(404).json(NOT_ACTIVE);

    const patient = await Patient.findOne({ 'emergency.token': token, 'emergency.enabled': true }).lean();
    if (!patient) return res.status(404).json(NOT_ACTIVE);
    const user = await User.findById(patient.user).select('name').lean();

    // Record the scan so the patient can see it. A failure here must not hide the data.
    try {
      const since = new Date(Date.now() - SCAN_DEDUPE_MS);
      const recent = await AccessLog.findOne({ patient: patient.user, action: 'emergency_scan', createdAt: { $gte: since } }).lean();
      if (!recent) await AccessLog.create({ patient: patient.user, viewerRole: 'public', action: 'emergency_scan' });
    } catch (e) {
      console.error('Emergency scan log failed:', e.message);
    }

    res.set('Cache-Control', 'no-store');
    res.json({
      name: user?.name || 'Unknown',
      age: ageFrom(patient.dob),
      bloodGroup: patient.bloodGroup || null,
      allergies: patient.allergies || [],
      medications: patient.medications || [],
      emergencyContact: patient.emergencyContactName
        ? { name: patient.emergencyContactName, phone: patient.emergencyContactPhone || null }
        : null,
    });
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong' });
  }
};
