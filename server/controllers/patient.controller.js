const Patient = require('../models/Patient');

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