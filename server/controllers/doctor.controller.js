const User = require('../models/User');
const Patient = require('../models/Patient');
const Visit = require('../models/Visit');

// Search patients by name or email
exports.searchPatients = async (req, res) => {
  try {
    const { query } = req.query;
    const users = await User.find({
      role: 'patient',
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ],
    }).select('name email');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a specific patient's KYC + visit history
exports.getPatientDetails = async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await Patient.findOne({ user: patientId });
    const visits = await Visit.find({ patient: patientId }).sort({ createdAt: -1 });
    res.json({ patient, visits });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add a new visit/prescription — includes AI allergy conflict check
exports.addVisit = async (req, res) => {
  try {
    const { patientId, diagnosis, prescription, notes } = req.body;

    // AI Allergy/Drug Conflict Check (rule-based)
    const patient = await Patient.findOne({ user: patientId });
    const conflicts = [];
    if (patient && patient.allergies?.length) {
      prescription.forEach((drug) => {
        patient.allergies.forEach((allergy) => {
          if (drug.toLowerCase().includes(allergy.toLowerCase())) {
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