const AccessLog = require('../models/AccessLog');

const DEDUPE_MS = 10 * 60 * 1000;

async function recordAccess(patientId, viewer, action) {
  try {
    const since = new Date(Date.now() - DEDUPE_MS);
    const recent = await AccessLog.findOne({
      patient: patientId,
      viewer: viewer.id,
      action,
      createdAt: { $gte: since },
    }).lean();
    if (recent) return;
    await AccessLog.create({ patient: patientId, viewer: viewer.id, viewerRole: viewer.role, action });
  } catch (err) {
    // Logging must never break the doctor's request.
    console.error('Access log failed:', err.message);
  }
}

module.exports = { recordAccess };