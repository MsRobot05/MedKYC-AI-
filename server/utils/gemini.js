
// Shared Gemini caller for the symptom chat and the care agent.
// Retries temporary Gemini server and rate-limit errors.

const DEFAULT_MODEL = 'gemini-flash-latest';
const MAX_ATTEMPTS = 3;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function callGemini(body) {
const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing from the server environment.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let response;

    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(body),
      });
    } catch (error) {
      // Retry network errors, but do not retry after the final attempt.
      if (attempt === MAX_ATTEMPTS) throw error;

      console.warn(
        `Gemini network error. Retrying (${attempt}/${MAX_ATTEMPTS})...`
      );
      await wait(attempt * 1000);
      continue;
    }

    if (response.ok) {
      return response.json();
    }

    const responseText = await response.text();
    const retryable = [429, 500, 502, 503, 504].includes(response.status);

    if (!retryable || attempt === MAX_ATTEMPTS) {
     const err = new Error(`Gemini ${response.status} (model: ${model}): ${responseText.slice(0, 3000)}`);      err.status = response.status;
      throw err;
    }

    console.warn(
      `Gemini returned ${response.status}. Retrying in ${attempt * 2} seconds ` +
      `(attempt ${attempt + 1}/${MAX_ATTEMPTS}).`
    );

    await wait(attempt * 2000);
  }

  throw new Error('Gemini request failed after multiple attempts.');
}

// Gemini needs the conversation to start with a "user" turn,
// so drop the assistant greeting the UI shows first.
function toContents(messages = []) {
  const contents = messages
    .filter((m) => m && typeof m.text === 'string' && m.text.trim())
    .slice(-12)
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.text.slice(0, 2000) }],
    }));

  while (contents.length && contents[0].role === 'model') {
    contents.shift();
  }

  return contents;
}

console.log(`Gemini model: ${process.env.GEMINI_MODEL || DEFAULT_MODEL}`);

module.exports = { callGemini, toContents };