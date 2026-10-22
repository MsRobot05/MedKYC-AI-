const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const c = require('../controllers/appointment.controller');

router.get('/doctors', auth, requireRole('patient'), c.listDoctors);
router.get('/taken', auth, requireRole('patient'), c.takenSlots);
router.post('/', auth, requireRole('patient'), c.create);
router.get('/mine', auth, requireRole('patient', 'doctor'), c.mine);
router.patch('/:id/status', auth, requireRole('patient', 'doctor'), c.setStatus);

module.exports = router;