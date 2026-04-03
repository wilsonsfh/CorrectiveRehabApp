// @ts-check
/** @typedef {import('../types').AnalysisResult} AnalysisResult */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

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
  const scoreContext = overallScore >= 80 ? 'excellent' : overallScore >= 60 ? 'moderate — needs attention' : 'significant asymmetries detected';

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
 * Generate an AI coaching summary for a session.
 * Returns null if no API key is set, results are empty, or request fails.
 * @param {string} categoryLabel
 * @param {AnalysisResult[]} results
 * @returns {Promise<string|null>}
 */
export async function generateCoachSummary(categoryLabel, results) {
  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_api_key_here') return null;
  if (!results?.length) return null;

  try {
    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
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
