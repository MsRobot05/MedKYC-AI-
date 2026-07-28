const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const { getAllBloodBanks, preRegisterRequest } = require('../controllers/bloodbank.controller');

router.get('/', getAllBloodBanks);
router.post('/request', auth, preRegisterRequest);

module.exports = router;