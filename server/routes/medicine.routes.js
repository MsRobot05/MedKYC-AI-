const express = require('express');
const router = express.Router();
const { searchMedicine } = require('../controllers/medicine.controller');
router.get('/search', searchMedicine);
module.exports = router;