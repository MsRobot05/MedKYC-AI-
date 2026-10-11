const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth.middleware');

const {
  getAvailable,
  bookAmbulance,
  updateStatus
} = require('../controllers/ambulance.controller');

router.get('/', getAvailable);
router.post('/book', auth, bookAmbulance);
router.post('/status', auth, updateStatus);

module.exports = router;