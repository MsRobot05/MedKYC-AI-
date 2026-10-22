const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const { mine } = require('../controllers/accesslog.controller');

router.get('/', auth, requireRole('patient'), mine);

module.exports = router;