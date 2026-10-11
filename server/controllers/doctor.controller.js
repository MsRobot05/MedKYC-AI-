const User = require('../models/User');
const Patient = require('../models/Patient');
const Visit = require('../models/Visit');

const WITHHELD = ['Withheld by patient'];

// Enforce the patient's consent switches before a doctor sees the record.
function applyConsent(patientDoc) {
  if (!patientDoc) return null;
  const p = patientDoc.toObject ? patientDoc.toObject() : { ...patientDoc };
  const consent = p.consent || {};
  if (consent.shareAllergies === false) p.allergies = WITHHELD;
  if (consent.shareMedications === false) p.medications = WITHHELD;
  if (consent.shareHistory === false) p.pastSurgeries = WITHHELD;
  return p;
}

exports.searchPatients = async (req, res) => {
  try {
    const raw = String(req.query.query || '').slice(0, 60);
    const safe = raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const users = await User.find({
      role: 'patient',
      $or: [
        { name: { $regex: safe, $options: 'i' } },
        { email: { $regex: safe, $options: 'i' } },
      ],
    }).select('name email').limit(20);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPatientDetails = async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await Patient.findOne({ user: patientId });
    const visits = await Visit.find({ patient: patientId }).sort({ createdAt: -1 });
    res.json({ patient: applyConsent(patient), visits });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addVisit = async (req, res) => {
  try {
    const { patientId, diagnosis, notes } = req.body;
    const prescription = Array.isArray(req.body.prescription) ? req.body.prescription : [];

    // Safety decision: the allergy check always runs against the FULL record,
    // even if the patient hid allergies from the doctor's view.
    const patient = await Patient.findOne({ user: patientId });
    const conflicts = [];
    if (patient && patient.allergies?.length) {
      prescription.forEach((drug) => {
        patient.allergies.forEach((allergy) => {
          if (String(drug).toLowerCase().includes(allergy.toLowerCase())) {
            conflicts.push(`${drug} conflicts with recorded allergy: ${allergy}`);
          }
        });
      });
    }

    const visit = await Visit.create({
      patient: patientId,
      doctor: req.user.id,
      diagnosis,
      prescription,
      notes,
    });

    res.status(201).json({ message: 'Visit recorded', visit, conflicts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};