const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const { getSettings, updateSettings, publicView } = require('../controllers/emergency.controller');

router.get('/public/:token', publicView); // no login on purpose
router.get('/settings', auth, requireRole('patient'), getSettings);
router.post('/settings', auth, requireRole('patient'), updateSettings);

module.exports = router;