const express = require("express");
const router = express.Router();

const { symptomChecker } = require("../controllers/ai.controller");

router.post("/symptom-checker", symptomChecker);

module.exports = router;