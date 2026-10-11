const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const { checkSymptoms } = require('../controllers/symptom.controller');

router.post('/check', auth, checkSymptoms);

module.exports = router;