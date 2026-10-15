const Patient = require('../models/Patient');
const Visit = require('../models/Visit');
const Tesseract = require('tesseract.js');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const GENDERS = ['female', 'male', 'other', 'prefer_not_to_say'];

function cleanList(value, max = 30) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const out = [];
  for (const item of value) {
    const s = String(item ?? '').trim().slice(0, 80);
    if (!s || seen.has(s.toLowerCase())) continue;
    seen.add(s.toLowerCase());
    out.push(s);
    if (out.length >= max) break;
  }
  return out;
}

// '' = empty, null = invalid, otherwise a 10-digit Indian mobile number
function cleanPhone(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) return '';
  const local = digits.length > 10 ? digits.slice(-10) : digits; // drops +91 or a leading 0
  return /^[6-9]\d{9}$/.test(local) ? local : null;
}

function cleanAbha(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.length === 14 ? digits : null;
}

function parseKyc(body) {
  const b = body || {};
  const errors = [];
  const set = {};

  if (b.dob) {
    const d = new Date(b.dob);
    if (Number.isNaN(d.getTime()) || d > new Date() || d.getFullYear() < 1900) errors.push('Date of birth is not valid');
    else set.dob = d;
  } else {
    set.dob = null;
  }

  const gender = String(b.gender || '');
  if (gender && !GENDERS.includes(gender)) errors.push('Gender is not valid');
  else set.gender = gender;

  const bloodGroup = String(b.bloodGroup || '');
  if (bloodGroup && !BLOOD_GROUPS.includes(bloodGroup)) errors.push('Blood group is not valid');
  else set.bloodGroup = bloodGroup;

  const phone = cleanPhone(b.phone);
  if (phone === null) errors.push('Mobile number must be a valid 10-digit Indian number');
  else set.phone = phone;

  const ecPhone = cleanPhone(b.emergencyContactPhone);
  if (ecPhone === null) errors.push('Emergency contact number must be a valid 10-digit Indian mobile number');
  else set.emergencyContactPhone = ecPhone;

  const abha = cleanAbha(b.abhaNumber);
  if (abha === null) errors.push('ABHA number must be 14 digits');
  else set.abhaNumber = abha;

  set.city = String(b.city || '').trim().slice(0, 60);
  set.emergencyContactName = String(b.emergencyContactName || '').trim().slice(0, 80);
  set.allergies = cleanList(b.allergies);
  set.medications = cleanList(b.medications);
  set.pastSurgeries = cleanList(b.pastSurgeries);

  const consent = b.consent || {};
  set['consent.shareAllergies'] = consent.shareAllergies !== false;
  set['consent.shareHistory'] = consent.shareHistory !== false;
  set['consent.shareMedications'] = consent.shareMedications !== false;

  return { errors, set };
}

exports.createOrUpdateKYC = async (req, res) => {
  try {
    const { errors, set } = parseKyc(req.body);
    if (errors.length) return res.status(400).json({ message: errors.join('. ') });

    const patient = await Patient.findOneAndUpdate(
      { user: req.user.id },
      { $set: set },
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ message: 'KYC saved', patient });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyKYC = async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user.id });
    if (!patient) return res.status(404).json({ message: 'No KYC found yet' });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyVisits = async (req, res) => {
  try {
    const visits = await Visit.find({ patient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('doctor', 'name')
      .lean();
    res.json(visits);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------- Server-side OCR (kept so the existing /scan-id route still works) ----------
function extractFieldsFromText(rawText) {
  const result = { dateOfBirth: null, bloodGroup: null, rawText };

  const dobMatch =
    rawText.match(/(?:DOB|D\.O\.B|Date of Birth)[:\s]*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i) ||
    rawText.match(/\b(\d{1,2}[\/\-]\d{1,2}[\/\-](?:19|20)\d{2})\b/);

  if (dobMatch) {
    const raw = dobMatch[1].replace(/-/g, '/');
    const [d, m, y] = raw.split('/');
    const year = y.length === 2 ? `20${y}` : y;
    result.dateOfBirth = `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  const bloodMatch = rawText.match(/\b(A|B|AB|O)\s?([+-])\b/i);
  if (bloodMatch) result.bloodGroup = `${bloodMatch[1].toUpperCase()}${bloodMatch[2]}`;

  return result;
}

exports.scanId = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded. Field name must be "idImage".' });

    const { data } = await Tesseract.recognize(req.file.buffer, 'eng');
    const extracted = extractFieldsFromText(data.text);

    if (!extracted.dateOfBirth && !extracted.bloodGroup) {
      return res.status(200).json({
        success: false,
        message: 'Could not confidently read date of birth or blood group. Try a clearer photo, or enter manually.',
        rawText: data.text,
      });
    }

    res.json({
      success: true,
      dateOfBirth: extracted.dateOfBirth,
      bloodGroup: extracted.bloodGroup,
      confidence: data.confidence,
    });
  } catch (err) {
    console.error('Scan ID OCR error:', err);
    res.status(500).json({ error: 'Failed to process the image. Please try again.' });
  }
};