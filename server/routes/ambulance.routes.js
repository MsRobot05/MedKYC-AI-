const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const { getAvailable, bookAmbulance } = require('../controllers/ambulance.controller');

router.get('/', getAvailable);
router.post('/book', auth, bookAmbulance);

module.exports = router;