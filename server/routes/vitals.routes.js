const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const { list, add, remove } = require('../controllers/vitals.controller');

router.get('/', auth, requireRole('patient'), list);
router.post('/', auth, requireRole('patient'), add);
router.delete('/:id', auth, requireRole('patient'), remove);

module.exports = router;