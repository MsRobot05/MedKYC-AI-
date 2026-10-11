const User = require('../models/User');
const BloodBank = require('../models/BloodBank');
const Ambulance = require('../models/Ambulance');
const Visit = require('../models/Visit');

exports.getStats = async (req, res) => {
  try {
    const patients = await User.countDocuments({ role: 'patient' });
    const doctors = await User.countDocuments({ role: 'doctor' });
    const bloodBanks = await BloodBank.countDocuments();
    const ambulances = await Ambulance.countDocuments();
    const availableAmbulances = await Ambulance.countDocuments({ available: true });
    const totalVisits = await Visit.countDocuments();

    res.json({ patients, doctors, bloodBanks, ambulances, availableAmbulances, totalVisits });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('name email role createdAt').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};