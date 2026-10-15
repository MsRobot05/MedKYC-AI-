const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const c = require('../controllers/admin.controller');

// Every route in this file is admin-only.
router.use(auth, requireRole('admin'));

router.get('/overview', c.getOverview);

router.get('/users', c.getAllUsers);
router.patch('/users/:id/role', c.updateUserRole);

router.get('/bloodbanks', c.listBloodBanks);
router.patch('/bloodbanks/:id/stock', c.updateBloodStock);

router.get('/ambulances', c.listAmbulances);
router.patch('/ambulances/:id', c.updateAmbulance);

router.get('/blood-requests', c.listBloodRequests);
router.patch('/blood-requests/:id', c.updateBloodRequest);

module.exports = router;