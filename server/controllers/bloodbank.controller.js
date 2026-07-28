const BloodBank = require('../models/BloodBank');
const BloodRequest = require('../models/BloodRequest');

exports.getAllBloodBanks = async (req, res) => {
  try {
    const banks = await BloodBank.find();
    res.json(banks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.preRegisterRequest = async (req, res) => {
  try {
    const { bloodBankId, bloodGroup, neededBy } = req.body;
    const request = await BloodRequest.create({
      patient: req.user.id,
      bloodBank: bloodBankId,
      bloodGroup,
      neededBy,
    });
    res.status(201).json({ message: 'Blood request pre-registered', request });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};