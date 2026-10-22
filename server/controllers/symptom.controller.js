
const { callGemini, toContents } = require('../utils/gemini');

const SYSTEM = `You are the MedKYC-AI health assistant.
Be warm, professional, empathetic, and conversational.
Ask relevant follow-up questions about symptoms, duration,
severity, and associated symptoms.
Give general health information without claiming to diagnose.
Do not invent medical history or test results.
For chest pain, difficulty breathing, severe bleeding,
unconsciousness, or other potentially life-threatening symptoms,
advise immediate emergency care.
Keep replies concise and easy to understand.
You are an AI assistant, not a substitute for a doctor.`;

function getFallbackReply(message) {
  const text = String(message || '').toLowerCase();

  if (/chest pain|difficulty breathing|trouble breathing|heavy bleeding|unconscious|stroke symptoms/.test(text)) {
    return 'Your symptoms could indicate a medical emergency. Please call 112 in India or seek emergency medical care immediately. Do not wait for a chat response.';
  }

  if (/fever|headache|cough|cold|sore throat/.test(text)) {
    return 'I’m sorry you’re not feeling well. I’d like to understand your symptoms better. When did they start, how severe are they, and have you noticed any other symptoms? If you feel seriously unwell or your condition worsens, please seek medical care.';
  }

  if (/stomach|abdominal|vomit|nausea|diarrhea|diarrhoea/.test(text)) {
    return 'I can help you think through your symptoms. When did the discomfort begin, where do you feel it, and how severe is it? Have you also experienced vomiting, fever, or changes in bowel movements? Seek urgent medical care for severe or worsening pain.';
  }

  if (/thank|thanks/.test(text)) {
    return 'You’re welcome. Is there anything else about your symptoms or health that you would like help understanding?';
  }

  if (/^(hi|hello|hey|good morning|good evening)[!. ]*$/.test(text)) {
    return 'Hello! I’m your MedKYC-AI health assistant. How can I help you today? You can tell me what you’re experiencing, when it started, and how you’re feeling.';
  }

  return 'I’m here to help you understand your health concerns. Could you tell me a little more about what you’re experiencing, when it started, and how severe it feels? I can offer general guidance, but a healthcare professional can assess your individual condition.';
}

exports.checkSymptoms = async (req, res) => {
  try {
    const contents = toContents(req.body.messages);

    if (!contents.length) {
      return res.status(400).json({
        reply: 'Please tell me what you would like help with.'
      });
    }

    const data = await callGemini({
      system_instruction: {
        parts: [{ text: SYSTEM }]
      },
      contents
    });

    const reply = (data.candidates?.[0]?.content?.parts || [])
      .map((part) => part.text || '')
      .join('')
      .trim();

    if (reply) {
      return res.json({ reply });
    }

    return res.json({
      reply: getFallbackReply(contents[contents.length - 1]?.parts?.[0]?.text)
    });
  } catch (err) {
    console.error('Symptom assistant error:', err.message);

    const lastMessage = req.body.messages?.slice(-1)[0]?.text || '';

    return res.json({
      reply: getFallbackReply(lastMessage)
    });
  }
};
