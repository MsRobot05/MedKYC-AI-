const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const { searchPatients, getPatientDetails, addVisit } = require('../controllers/doctor.controller');

router.get('/search', auth, searchPatients);
router.get('/patient/:patientId', auth, getPatientDetails);
router.post('/visit', auth, addVisit);

module.exports = router;