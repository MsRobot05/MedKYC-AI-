const mongoose = require('mongoose');

const bloodBankSchema = new mongoose.Schema({
  name: String,
  address: String,
  phone: String,
  lat: Number,
  lng: Number,
  stock: {
    'A+': { type: Number, default: 0 },
    'A-': { type: Number, default: 0 },
    'B+': { type: Number, default: 0 },
    'B-': { type: Number, default: 0 },
    'O+': { type: Number, default: 0 },
    'O-': { type: Number, default: 0 },
    'AB+': { type: Number, default: 0 },
    'AB-': { type: Number, default: 0 },
  },
});

module.exports = mongoose.model('BloodBank', bloodBankSchema);