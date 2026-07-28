const mongoose = require('mongoose');

const ambulanceSchema = new mongoose.Schema({
  driverName: String,
  vehicleNumber: String,
  phone: String,
  lat: Number,
  lng: Number,
  available: { type: Boolean, default: true },
});

module.exports = mongoose.model('Ambulance', ambulanceSchema);