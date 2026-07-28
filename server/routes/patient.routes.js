const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const { createOrUpdateKYC, getMyKYC } = require('../controllers/patient.controller');

router.post('/kyc', auth, createOrUpdateKYC);
router.get('/kyc', auth, getMyKYC);

module.exports = router;