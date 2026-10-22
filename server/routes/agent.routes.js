
const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth.middleware');
const { callGemini, toContents } = require('../utils/gemini');

const Patient = require('../models/Patient');
const Ambulance = require('../models/Ambulance');
const BloodBank = require('../models/BloodBank');

const SYSTEM = `
You are the Care Agent inside MedKYC-AI.
Help users navigate their healthcare needs.
You are an AI assistant, not a doctor.
For chest pain, breathing difficulty, heavy bleeding, or loss of consciousness,
tell the user to call emergency services at 108 or 112 immediately.
Never claim that a booking or blood request has been completed unless the
backend confirms it. Keep replies clear and concise.
`;

function distanceKm(a, b) {
  const rad = (n) => (n * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);

  const value =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) *
      Math.cos(rad(b.lat)) *
      Math.sin(dLng / 2) ** 2;

  return 6371 * 2 * Math.atan2(
    Math.sqrt(value),
    Math.sqrt(1 - value)
  );
}

router.post('/chat', auth, async (req, res) => {
  try {
    const { messages = [], location = null } = req.body;

    if (!Array.isArray(messages) || !messages.length) {
      return res.status(400).json({
        reply: 'Please tell me what you need help with.',
        trace: [],
        pendingActions: [],
      });
    }

    const lastMessage = [...messages]
      .reverse()
      .find((m) => m?.role === 'user' && typeof m.text === 'string');

    if (!lastMessage || !lastMessage.text.trim()) {
      return res.status(400).json({
        reply: 'Please enter a message.',
        trace: [],
        pendingActions: [],
      });
    }

    const text = lastMessage.text.trim();
    const lower = text.toLowerCase();
    const trace = [];
    const pendingActions = [];

    // Emergency guidance takes priority over normal assistance.
    if (
      /\b(chest pain|can't breathe|cannot breathe|difficulty breathing|trouble breathing|heavy bleeding|unconscious|loss of consciousness)\b/i.test(text)
    ) {
      return res.json({
        reply:
          'This may be a medical emergency. Call 108 or 112 immediately, and do not wait for an AI response. If possible, ask someone nearby to help.',
        trace: [],
        pendingActions: [],
      });
    }

    // Read the logged-in patient's saved profile when requested.
    if (
      /\b(profile|allerg(y|ies)|medications?|medicines|past surgeries|medical history)\b/i.test(lower)
    ) {
      const patient = await Patient.findOne({
        user: req.user.id,
      }).populate('user', 'name email');

      trace.push('saved_patient_profile');

      if (!patient) {
        return res.json({
          reply:
            'I could not find a saved patient profile for your account. Please check your profile details.',
          trace,
          pendingActions,
        });
      }

      const parts = [];

      if (/\b(profile|allerg(y|ies))\b/i.test(lower)) {
        parts.push(
          `Allergies: ${
            patient.allergies?.length
              ? patient.allergies.join(', ')
              : 'None recorded'
          }`
        );
      }

      if (/\b(medications?|medicines|medical history)\b/i.test(lower)) {
        if (patient.consent?.shareMedications !== false) {
          parts.push(
            `Medications: ${
              patient.medications?.length
                ? patient.medications.join(', ')
                : 'None recorded'
            }`
          );
        } else {
          parts.push('Medication information is not shared in your profile.');
        }
      }

      if (/\b(past surgeries|medical history)\b/i.test(lower)) {
        if (patient.consent?.shareHistory !== false) {
          parts.push(
            `Past surgeries: ${
              patient.pastSurgeries?.length
                ? patient.pastSurgeries.join(', ')
                : 'None recorded'
            }`
          );
        } else {
          parts.push('Medical history is not shared in your profile.');
        }
      }

      return res.json({
        reply: parts.join('\n'),
        trace,
        pendingActions,
      });
    }

    // Find available ambulances. Booking still requires user confirmation.
    if (/\b(ambulance|ambulances)\b/i.test(lower)) {
      let ambulances = await Ambulance.find({ available: true });

      if (
        location &&
        Number.isFinite(Number(location.lat)) &&
        Number.isFinite(Number(location.lng))
      ) {
        const userLocation = {
          lat: Number(location.lat),
          lng: Number(location.lng),
        };

        ambulances = ambulances
          .filter(
            (a) =>
              Number.isFinite(a.lat) &&
              Number.isFinite(a.lng)
          )
          .sort(
            (a, b) =>
              distanceKm(userLocation, a) -
              distanceKm(userLocation, b)
          );
      }

      trace.push('find_available_ambulances');

      if (!ambulances.length) {
        return res.json({
          reply:
            'I could not find an available ambulance in the current database. If this is an emergency, call 108 or 112 now.',
          trace,
          pendingActions,
        });
      }

      const ambulance = ambulances[0];

      pendingActions.push({
        type: 'book_ambulance',
        ambulanceId: String(ambulance._id),
        label: `Request ambulance ${ambulance.vehicleNumber || ''}${
          location &&
          Number.isFinite(Number(location.lat)) &&
          Number.isFinite(Number(location.lng)) &&
          Number.isFinite(ambulance.lat) &&
          Number.isFinite(ambulance.lng)
            ? ` (approximately ${distanceKm(
                {
                  lat: Number(location.lat),
                  lng: Number(location.lng),
                },
                ambulance
              ).toFixed(1)} km away)`
            : ''
        }?`,
      });

      return res.json({
        reply:
          'I found an available ambulance in the database. Review the request below and confirm only if you want to proceed. For an emergency, call 108 or 112 directly.',
        trace,
        pendingActions,
      });
    }

    // Find blood banks with stock for the requested blood group.
    if (/\b(blood|blood bank|bloodbank)\b/i.test(lower)) {
      const match = text.match(/\b(AB[+-]|A[+-]|B[+-]|O[+-])\b/i);
      const bloodGroup = match?.[1]?.toUpperCase();

      if (!bloodGroup) {
        return res.json({
          reply:
            'Which blood group do you need? For example, O+, O-, A+, or B-.',
          trace,
          pendingActions,
        });
      }

      let banks = await BloodBank.find({
        [`stock.${bloodGroup}`]: { $gt: 0 },
      });

      if (
        location &&
        Number.isFinite(Number(location.lat)) &&
        Number.isFinite(Number(location.lng))
      ) {
        const userLocation = {
          lat: Number(location.lat),
          lng: Number(location.lng),
        };

        banks = banks
          .filter(
            (b) =>
              Number.isFinite(b.lat) &&
              Number.isFinite(b.lng)
          )
          .sort(
            (a, b) =>
              distanceKm(userLocation, a) -
              distanceKm(userLocation, b)
          );
      }

      trace.push('find_blood_banks_with_stock');

      if (!banks.length) {
        return res.json({
          reply: `I could not find a blood bank with recorded ${bloodGroup} stock in the current database. Please contact local blood banks directly to verify availability.`,
          trace,
          pendingActions,
        });
      }

      const bank = banks[0];

      pendingActions.push({
        type: 'blood_request',
        bloodBankId: String(bank._id),
        bloodGroup,
        label: `Pre-register a ${bloodGroup} blood request with ${bank.name || 'this blood bank'}?`,
      });

      return res.json({
        reply:
          `I found ${bank.name || 'a blood bank'} with recorded ${bloodGroup} stock. Stock can change, so confirm availability with the bank. Review the request below if you want to pre-register it.`,
        trace,
        pendingActions,
      });
    }

    // Normal conversation uses the existing Gemini helper.
    const contents = toContents(messages);

    if (!contents.length) {
      return res.status(400).json({
        reply: 'Please enter a message.',
        trace,
        pendingActions,
      });
    }

    const data = await callGemini({
      system_instruction: {
        parts: [{ text: SYSTEM }],
      },
      contents,
    });

    const reply = (data.candidates?.[0]?.content?.parts || [])
      .map((part) => part.text || '')
      .join('')
      .trim();

    trace.push('gemini');

    return res.json({
      reply:
        reply ||
        'I could not generate a response right now. Please try again.',
      trace,
      pendingActions,
    });
  } catch (err) {
    console.error('Care Agent error:', err.message);

    return res.status(500).json({
      reply:
        err.status === 429 || err.status === 503
          ? 'The AI service is busy right now. Please wait a little and try again. For emergencies, call 108 or 112.'
          : 'The Care Agent is temporarily unavailable. Please try again. For emergencies, call 108 or 112.',
      trace: [],
      pendingActions: [],
    });
  }
});

module.exports = router;
