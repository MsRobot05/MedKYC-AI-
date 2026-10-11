const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const { searchPatients, getPatientDetails, addVisit } = require('../controllers/doctor.controller');

router.get('/search', auth, requireRole('doctor', 'admin'), searchPatients);
router.get('/patient/:patientId', auth, requireRole('doctor', 'admin'), getPatientDetails);
router.post('/visit', auth, requireRole('doctor', 'admin'), addVisit);

module.exports = router;