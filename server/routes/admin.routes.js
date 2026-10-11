const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const { getStats, getAllUsers } = require('../controllers/admin.controller');

router.get('/stats', auth, requireRole('admin'), getStats);
router.get('/users', auth, requireRole('admin'), getAllUsers);

module.exports = router;