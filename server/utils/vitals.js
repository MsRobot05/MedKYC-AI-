const TYPES = ['bp', 'sugar', 'pulse', 'spo2', 'weight'];

// Plausibility limits: they only reject typos, they don't judge health.
const LIMITS = {
  bp: { min: 50, max: 260, min2: 30, max2: 160 },
  sugar: { min: 20, max: 800 },
  pulse: { min: 20, max: 250 },
  spo2: { min: 50, max: 100 },
  weight: { min: 2, max: 400 },
};

function validate(type, body) {
  if (!TYPES.includes(type)) return { error: 'Unknown reading type' };
  const lim = LIMITS[type];
  const value = Number(body.value);
  if (!Number.isFinite(value) || value < lim.min || value > lim.max) {
    return { error: `That value looks wrong. Expected ${lim.min} to ${lim.max}.` };
  }
  const data = { value };

  if (type === 'bp') {
    const value2 = Number(body.value2);
    if (!Number.isFinite(value2) || value2 < lim.min2 || value2 > lim.max2) {
      return { error: `The bottom number should be ${lim.min2} to ${lim.max2}.` };
    }
    if (value2 >= value) return { error: 'The top number must be higher than the bottom number.' };
    data.value2 = value2;
  }
  if (type === 'sugar') data.context = body.context === 'after_meal' ? 'after_meal' : 'fasting';
  return { data };
}

// Returns 'normal' | 'watch' | 'high' | 'low' | null (no range, e.g. weight)
function classify(type, r) {
  const v = r.value;
  switch (type) {
    case 'bp': {
      const d = r.value2;
      if (v >= 140 || d >= 90) return 'high';
      if (v < 90 || d < 60) return 'low';
      if (v >= 120 || d >= 80) return 'watch';
      return 'normal';
    }
    case 'sugar':
      if (v < 70) return 'low';
      if (r.context === 'after_meal') return v < 140 ? 'normal' : v < 200 ? 'watch' : 'high';
      return v < 100 ? 'normal' : v < 126 ? 'watch' : 'high';
    case 'pulse':
      if (v < 40 || v > 130) return 'high';
      return v < 60 || v > 100 ? 'watch' : 'normal';
    case 'spo2':
      return v >= 95 ? 'normal' : v >= 92 ? 'watch' : 'high';
    default:
      return null;
  }
}

module.exports = { TYPES, validate, classify };