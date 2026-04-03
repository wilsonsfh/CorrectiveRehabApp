// @ts-check
/** @typedef {import('../types').AnalysisResult} AnalysisResult */

/**
 * @typedef {{ id: string, name: string, tagline: string, url: string, model: string, key: () => string|undefined, placeholder: string }} Provider
 */

/** @type {Record<string, Provider>} */
export const PROVIDERS = {
  groq: {
    id: 'groq',
    name: 'Groq',
    tagline: '⚡ Fastest — best for quick post-set feedback',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile',
    key: () => process.env.EXPO_PUBLIC_GROQ_API_KEY,
    placeholder: 'your_groq_api_key_here',
  },
  deepseek: {
    id: 'deepseek',
    name: 'Deepseek',
    tagline: '🧠 Analytical — best for detailed movement breakdowns',
    url: 'https://api.deepseek.com/chat/completions',
    model: 'deepseek-chat',
    key: () => process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY,
    placeholder: 'your_deepseek_api_key_here',
  },
};

/**
 * Returns which providers have real API keys configured.
 * @returns {Provider[]}
 */
export function availableProviders() {
  return Object.values(PROVIDERS).filter(
    p => { const k = p.key(); return k && k !== p.placeholder; }
  );
}

/**
 * Build a coaching prompt from per-angle analysis results.
 * @param {string} categoryLabel
 * @param {AnalysisResult[]} results
 * @returns {string}
 */
function buildPrompt(categoryLabel, results) {
  const overallScore = Math.round(
    results.reduce((sum, r) => sum + r.symmetry_score, 0) / results.length
  );
  const scoreContext = overallScore >= 80
    ? 'excellent'
    : overallScore >= 60
    ? 'moderate — needs attention'
    : 'significant asymmetries detected';

  const angleBreakdown = results.map(r => {
    const issueLines = r.issues?.length
      ? r.issues.map(i => `  • ${i.label} [${i.severity}]: ${i.detail}`).join('\n')
      : '  No issues detected';
    return `${r.angle.toUpperCase()} — ${r.symmetry_score}/100\n${issueLines}`;
  }).join('\n\n');

  return `You are an expert strength coach reviewing biomechanical data from a recorded lifting session.

Lift: ${categoryLabel}
Overall symmetry score: ${overallScore}/100 (${scoreContext})

Per-angle breakdown:
${angleBreakdown}

Write a 3-sentence coaching summary:
1. Interpret the symmetry score and movement quality in practical lifting terms
2. Name the single most critical issue found and its real-world impact on performance or injury risk
3. Give one specific corrective action — a drill, cue, or mobility work — to address it next session

Rules: No filler phrases ("Great job", "It looks like", "Overall"). Be direct and data-driven. Max 25 words per sentence. Talk like a knowledgeable lifting coach.`;
}

/**
 * Generate a coaching summary using a specific provider.
 * Returns null if the key is missing or the request fails.
 * @param {Provider} provider
 * @param {string} categoryLabel
 * @param {AnalysisResult[]} results
 * @returns {Promise<string|null>}
 */
export async function generateCoachSummary(provider, categoryLabel, results) {
  if (!results?.length) return null;
  const apiKey = provider.key();
  if (!apiKey || apiKey === provider.placeholder) return null;

  try {
    const res = await fetch(provider.url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [{ role: 'user', content: buildPrompt(categoryLabel, results) }],
        max_tokens: 200,
        temperature: 0.4,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}
