const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const upload = require('../middleware/upload');
const { createOrUpdateKYC, getMyKYC, scanId } = require('../controllers/patient.controller');

router.post('/kyc', auth, createOrUpdateKYC);
router.get('/kyc', auth, getMyKYC);
router.post('/scan-id', auth, upload.single('idImage'), scanId);

module.exports = router;