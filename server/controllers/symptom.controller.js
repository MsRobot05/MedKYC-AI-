const { callGemini, toContents } = require('../utils/gemini');

const SYSTEM = `You are a helpful AI health assistant inside a medical app called MedKYC-AI, acting like a first-contact doctor would. Ask relevant follow-up questions (duration, severity, related symptoms). Once you have enough information, suggest a likely department (General Medicine, Dental, Orthopedics, Dermatology, Ophthalmology, Cardiology, Gastroenterology, Psychiatry, ENT or Gynecology) and general advice. Be clear you are an AI assistant, not a doctor. For serious symptoms (chest pain, trouble breathing, heavy bleeding, loss of consciousness) tell the person to call 108 or 112 immediately. Keep each reply to 2-4 sentences.`;

exports.checkSymptoms = async (req, res) => {
  try {
    const contents = toContents(req.body.messages);
    if (!contents.length) {
      return res.status(400).json({ reply: 'Please describe your symptoms first.' });
    }

    const data = await callGemini({
      system_instruction: { parts: [{ text: SYSTEM }] },
      contents,
    });

    const reply = (data.candidates?.[0]?.content?.parts || [])
      .map((p) => p.text || '')
      .join('')
      .trim();

    if (!reply) {
      console.error('Symptom check: empty reply. Finish reason:', data.candidates?.[0]?.finishReason, data.promptFeedback);
    }

    res.json({ reply: reply || 'I could not generate a response. Please try rephrasing.' });
  } catch (err) {
    console.error('Symptom check error:', err.message);

    // On localhost, show the real reason in the chat. In production, keep it generic.
    const isProd = process.env.NODE_ENV === 'production';
    const generic =
      err.status === 429
        ? 'The AI is busy right now (free-tier limit). Wait a minute and try again.'
        : 'AI assistant unavailable right now. Please consult a doctor directly.';

    res.status(500).json({
      reply: isProd ? generic : `${generic}\n\n[debug] ${String(err.message).slice(0, 300)}`,
    });
  }
};