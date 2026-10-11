/**
 * PATIENT LOOKUP BY ID — MedKYC
 * ------------------------------------------------------------
 * Lets a logged-in DOCTOR search for a patient using their
 * unique patientId (e.g. MKC-2026-7JRPPW) instead of email.
 *
 * Respects the patient's consent flags — a doctor only sees
 * fields the patient has explicitly agreed to share. This reuses
 * the same consent model as your patient form, applied here too.
 *
 * Mount in your main app:
 *   app.use('/api', require('./routes/patientLookup'));
 * ------------------------------------------------------------
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Replace with your actual auth middleware (checks JWT + attaches req.user)
const { requireAuth, requireRole } = require('../middleware/auth');

// ---------------------------------------------------------------
// GET /api/patients/lookup/:patientId
// Doctors only. Returns patient info filtered by consent settings.
// ---------------------------------------------------------------
router.get(
  '/patients/lookup/:patientId',
  requireAuth,
  requireRole('doctor'),
  async (req, res) => {
    try {
      const { patientId } = req.params;

      const patient = await User.findOne({ patientId, role: 'patient' });
      if (!patient) {
        return res.status(404).json({ error: 'No patient found with that ID' });
      }

      // Always safe to share, regardless of consent — needed for identification/emergencies
      const baseInfo = {
        patientId: patient.patientId,
        name: patient.name,
        dateOfBirth: patient.dateOfBirth,
        bloodGroup: patient.bloodGroup,
        emergencyContactName: patient.emergencyContactName,
        emergencyContactPhone: patient.emergencyContactPhone,
      };

      // Consent-gated fields — only included if the patient opted in
      const consent = patient.consent || {};
      const gatedInfo = {};

      if (consent.shareAllergies) {
        gatedInfo.allergies = patient.allergies;
      }
      if (consent.shareHistory) {
        gatedInfo.pastSurgeries = patient.pastSurgeries;
      }
      if (consent.shareMedications) {
        gatedInfo.currentMedications = patient.currentMedications;
      }

      res.json({
        ...baseInfo,
        ...gatedInfo,
        consentNote: 'Fields not shown were withheld by patient consent settings.',
      });
    } catch (err) {
      console.error('Patient lookup error:', err);
      res.status(500).json({ error: 'Lookup failed' });
    }
  }
);

module.exports = router;

/**
 * ------------------------------------------------------------
 * Minimal example middleware/auth.js, if you don't have one yet:
 * ------------------------------------------------------------
 * const jwt = require('jsonwebtoken');
 *
 * function requireAuth(req, res, next) {
 *   const token = req.headers.authorization?.split(' ')[1];
 *   if (!token) return res.status(401).json({ error: 'No token provided' });
 *   try {
 *     req.user = jwt.verify(token, process.env.JWT_SECRET);
 *     next();
 *   } catch {
 *     res.status(401).json({ error: 'Invalid or expired token' });
 *   }
 * }
 *
 * function requireRole(role) {
 *   return (req, res, next) => {
 *     if (req.user?.role !== role) {
 *       return res.status(403).json({ error: `Only ${role}s can access this` });
 *     }
 *     next();
 *   };
 * }
 *
 * module.exports = { requireAuth, requireRole };
 * ------------------------------------------------------------
 */