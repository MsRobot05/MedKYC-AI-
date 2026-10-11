const Patient = require('../models/Patient');
const Tesseract = require('tesseract.js');

exports.createOrUpdateKYC = async (req, res) => {
  try {
    const userId = req.user.id;
    const { dob, bloodGroup, allergies, medications, pastSurgeries, emergencyContactName, emergencyContactPhone } = req.body;

    let patient = await Patient.findOne({ user: userId });

    if (patient) {
      Object.assign(patient, { dob, bloodGroup, allergies, medications, pastSurgeries, emergencyContactName, emergencyContactPhone });
      await patient.save();
    } else {
      patient = await Patient.create({ user: userId, dob, bloodGroup, allergies, medications, pastSurgeries, emergencyContactName, emergencyContactPhone });
    }

    res.status(200).json({ message: 'KYC saved', patient });
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

function extractFieldsFromText(rawText) {
  const result = { dateOfBirth: null, bloodGroup: null, rawText };

  const dobMatch = rawText.match(
    /(?:DOB|D\.O\.B|Date of Birth)[:\s]*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i
  ) || rawText.match(/\b(\d{1,2}[\/\-]\d{1,2}[\/\-](?:19|20)\d{2})\b/);

  if (dobMatch) {
    const raw = dobMatch[1].replace(/-/g, '/');
    const [d, m, y] = raw.split('/');
    const year = y.length === 2 ? `20${y}` : y;
    result.dateOfBirth = `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  const bloodMatch = rawText.match(/\b(A|B|AB|O)\s?([+-])\b/i);
  if (bloodMatch) {
    result.bloodGroup = `${bloodMatch[1].toUpperCase()}${bloodMatch[2]}`;
  }

  return result;
}

exports.scanId = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded. Field name must be "idImage".' });
    }

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