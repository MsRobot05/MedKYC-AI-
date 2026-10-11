const { analyzeSymptoms } = require("../ai/gemini");

exports.symptomChecker = async (req, res) => {
  try {
    const { symptoms } = req.body;

    if (!symptoms) {
      return res.status(400).json({
        success: false,
        message: "Symptoms are required",
      });
    }

    const result = await analyzeSymptoms(symptoms);

    res.json({
      success: true,
      result,
    });
  } catch (err) {
    console.error(err);

   res.status(500).json({
  success: false,
  message: err.message,
  error: err,
});
  }
};