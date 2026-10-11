const Ambulance = require('../models/Ambulance');

// DEMO SIMULATION: there is no real driver app yet. In production these
// status events would come from the driver's phone instead of timers.
function simulateRide(io, ambulance) {
  const room = String(ambulance._id);
  [['Accepted', 3000], ['En Route', 8000], ['Arrived', 15000]].forEach(([status, delay]) => {
    setTimeout(() => io?.to(room).emit('statusUpdate', { status }), delay);
  });
  setTimeout(() => {
    Ambulance.findByIdAndUpdate(room, { available: true }).catch(() => {});
  }, 60000);
}

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
    const ambulance = await Ambulance.findOneAndUpdate(
      { _id: ambulanceId, available: true },
      { available: false },
      { new: true }
    );
    if (!ambulance) return res.status(400).json({ message: 'Ambulance not available' });

    simulateRide(req.app.get('io'), ambulance);
    res.json({ message: 'Ambulance booked! Driver will contact you shortly.', ambulance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { ambulanceId, status } = req.body;
    res.json({ message: `Status updated to ${status}`, ambulanceId, status });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};  