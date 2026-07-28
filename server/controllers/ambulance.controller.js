const Ambulance = require('../models/Ambulance');

exports.getAvailable = async (req, res) => {
  try {
    const ambulances = await Ambulance.find({ available: true });
    res.json(ambulances);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.bookAmbulance = async (req, res) => {
  try {
    const { ambulanceId } = req.body;
    const ambulance = await Ambulance.findById(ambulanceId);
    if (!ambulance || !ambulance.available) {
      return res.status(400).json({ message: 'Ambulance not available' });
    }
    ambulance.available = false;
    await ambulance.save();
    res.json({ message: 'Ambulance booked! Driver will contact you shortly.', ambulance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};