// @ts-check
/**
 * Shared type definitions for CorrectiveRehabApp.
 *
 * These typedefs mirror exactly what the FastAPI server (server/analysis.py)
 * returns and what the Supabase schema (supabase-schema.sql) stores.
 *
 * Add `// @ts-check` to any .js file to activate TypeScript's checker
 * using these types, catching mismatches without a full TS migration.
 *
 * Usage in other files:
 *   // @ts-check
 *   /** @typedef {import('./types').AnalysisResult} AnalysisResult *\/
 */

// ─── Server response types (mirrors server/analysis.py output) ───────────────

/**
 * A single detected biomechanical issue from the analysis server.
 * Mirrors the `issues` array in the `/analyze` response.
 * @typedef {Object} Issue
 * @property {string} type - e.g. "knee_cave", "hip_shift", "butt_wink"
 * @property {'mild'|'moderate'|'severe'} severity
 * @property {string[]} affected_joints - MediaPipe landmark names
 * @property {number} [angle_value] - measured angle in degrees (if applicable)
 */

/**
 * A single MediaPipe pose landmark.
 * @typedef {Object} Landmark
 * @property {number} x - normalized [0, 1]
 * @property {number} y - normalized [0, 1]
 * @property {number} z - depth
 * @property {number} visibility - [0, 1]
 */

/**
 * One analyzed keyframe — a snapshot in time with pose landmarks.
 * Mirrors what the server stores in `analysis_results.keypoints` (JSONB array).
 * @typedef {Object} KeypointFrame
 * @property {number} timestamp_ms - position in the video in milliseconds
 * @property {Landmark[]} landmarks - 33 MediaPipe pose landmarks
 */

/**
 * Full response from POST /analyze on the analysis server.
 * @typedef {Object} ServerAnalysisResponse
 * @property {number} symmetry_score - 0–100
 * @property {Issue[]} issues
 * @property {KeypointFrame[]} keypoints - analyzed keyframes (~15 per video)
 */

// ─── Database row types (mirrors supabase-schema.sql) ────────────────────────

/**
 * A row from the `analysis_results` table, enriched with the video storage path.
 * Used throughout SessionResultScreen, CompareSessionScreen, SessionHistoryScreen.
 * @typedef {Object} AnalysisResult
 * @property {string} angle - 'side' | 'front' | 'above'
 * @property {number} symmetry_score - 0–100
 * @property {Issue[]} issues
 * @property {KeypointFrame[]|null} keypoints
 * @property {string|null} storagePath - Supabase Storage path (added client-side)
 */

/**
 * A row from the `gym_sessions` table.
 * @typedef {Object} GymSession
 * @property {string} id - UUID
 * @property {string} user_id - UUID
 * @property {string} category_id - e.g. "squat", "deadlift"
 * @property {string} category_label - e.g. "Squat", "Deadlift"
 * @property {string} date - ISO date string
 * @property {'draft'|'complete'} status
 * @property {'pending'|'analyzing'|'complete'|'failed'} analysis_status
 * @property {string|null} notes
 * @property {string} created_at - ISO timestamp
 */

/**
 * A row from the `session_videos` table.
 * @typedef {Object} SessionVideo
 * @property {string} id - UUID
 * @property {string} user_id - UUID
 * @property {string} session_id - UUID, FK to gym_sessions
 * @property {string} category_id
 * @property {'side'|'front'|'above'} angle
 * @property {string} storage_path - Supabase Storage path
 * @property {string} created_at - ISO timestamp
 */

/**
 * Enriched session summary used in SessionHistoryScreen.
 * @typedef {Object} SessionSummary
 * @property {string} id - UUID
 * @property {string} date - ISO date string
 * @property {number} avgScore - average symmetry_score across all angles
 * @property {string[]} angles - e.g. ['side', 'front']
 * @property {string} categoryLabel
 * @property {string} categoryId
 */

// Export empty object so this file is a proper JS module
export {};
