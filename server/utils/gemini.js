// Shared Gemini caller for the symptom chat and the care agent.
const DEFAULT_MODEL = 'gemini-2.5-flash';

async function callGemini(body) {
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': process.env.GEMINI_API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    const err = new Error(`Gemini ${response.status} (${model}): ${text.slice(0, 400)}`);
    err.status = response.status;
    throw err;
  }
  return response.json();
}

// Gemini needs the conversation to start with a "user" turn, so drop the
// assistant greeting the UI shows first.
function toContents(messages = []) {
  const contents = messages
    .filter((m) => m && typeof m.text === 'string' && m.text.trim())
    .slice(-12)
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.text.slice(0, 2000) }],
    }));
  while (contents.length && contents[0].role === 'model') contents.shift();
  return contents;
}

module.exports = { callGemini, toContents };