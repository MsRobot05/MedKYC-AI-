/**
 * SCAN ID — OCR route
 * ------------------------------------------------------------
 * Accepts an uploaded ID photo, runs OCR (tesseract.js), and
 * extracts whatever it can find: date of birth, blood group.
 *
 * Install: npm install tesseract.js multer
 *
 * Mount in patient.routes.js:
 *   const { scanId } = require('../controllers/patient.controller');
 *   const upload = require('../middleware/upload'); // multer config below
 *   router.post('/scan-id', auth, upload.single('idImage'), scanId);
 * ------------------------------------------------------------
 */

const Tesseract = require('tesseract.js');

// ---------------------------------------------------------------
// Pull structured fields out of raw OCR text.
// This is intentionally simple/regex-based — real ID formats vary
// a lot, so treat this as "best effort auto-fill", not ground truth.
// The user should always be able to review/edit before saving.
// ---------------------------------------------------------------
function extractFieldsFromText(rawText) {
  const result = { dateOfBirth: null, bloodGroup: null, rawText };

  // Date of Birth — matches DD/MM/YYYY, DD-MM-YYYY, or "DOB: ..." style
  const dobMatch = rawText.match(
    /(?:DOB|D\.O\.B|Date of Birth)[:\s]*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i
  ) || rawText.match(/\b(\d{1,2}[\/\-]\d{1,2}[\/\-](?:19|20)\d{2})\b/);

  if (dobMatch) {
    const raw = dobMatch[1].replace(/-/g, '/');
    const [d, m, y] = raw.split('/');
    const year = y.length === 2 ? `20${y}` : y;
    // Store as ISO (YYYY-MM-DD) so it drops straight into an <input type="date">
    result.dateOfBirth = `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Blood group — matches A+, A-, B+, B-, O+, O-, AB+, AB-
  const bloodMatch = rawText.match(/\b(A|B|AB|O)\s?([+-])\b/i);
  if (bloodMatch) {
    result.bloodGroup = `${bloodMatch[1].toUpperCase()}${bloodMatch[2]}`;
  }

  return result;
}

exports.scanId = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded. Field name must be "idImage".' });
    }

    const { data } = await Tesseract.recognize(req.file.buffer, 'eng', {
      // logger: (m) => console.log(m), // uncomment to debug OCR progress
    });

    const extracted = extractFieldsFromText(data.text);

    if (!extracted.dateOfBirth && !extracted.bloodGroup) {
      return res.status(200).json({
        success: false,
        message: 'Could not confidently read date of birth or blood group from this image. Try a clearer photo, or enter manually.',
        rawText: data.text,
      });
    }

    res.json({
      success: true,
      dateOfBirth: extracted.dateOfBirth,
      bloodGroup: extracted.bloodGroup,
      confidence: data.confidence,
    });
  } catch (err) {
    console.error('Scan ID OCR error:', err);
    res.status(500).json({ error: 'Failed to process the image. Please try again.' });
  }
};

/**
 * ------------------------------------------------------------
 * middleware/upload.js — multer config (in-memory, image only, 5MB cap)
 * ------------------------------------------------------------
 * const multer = require('multer');
 *
 * const upload = multer({
 *   storage: multer.memoryStorage(),
 *   limits: { fileSize: 5 * 1024 * 1024 },
 *   fileFilter: (req, file, cb) => {
 *     if (!file.mimetype.startsWith('image/')) {
 *       return cb(new Error('Only image files are allowed'));
 *     }
 *     cb(null, true);
 *   },
 * });
 *
 * module.exports = upload;
 * ------------------------------------------------------------
 */