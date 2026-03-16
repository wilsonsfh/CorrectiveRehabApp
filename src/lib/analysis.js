import { supabase } from './supabase';

const ANALYSIS_SERVER_URL = process.env.EXPO_PUBLIC_ANALYSIS_SERVER_URL;

/**
 * Call the Python analysis server for a single video.
 * Returns { symmetry_score, issues } or throws.
 */
async function callAnalysisServer({ storagePath, categoryId, angle, userId, sessionId, videoId }) {
  const res = await fetch(`${ANALYSIS_SERVER_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      storage_path: storagePath,
      category_id: categoryId,
      angle,
      user_id: userId,
      session_id: sessionId,
      video_id: videoId,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Analysis server error ${res.status}: ${text}`);
  }

  return res.json();
}

/**
 * Analyze a single video — call server then write result to DB.
 * App writes to DB (not server) to maintain RLS via user's JWT.
 */
export async function analyzeVideo(video, userId, sessionId) {
  const serverResult = await callAnalysisServer({
    storagePath: video.storage_path,
    categoryId: video.category_id,
    angle: video.angle,
    userId,
    sessionId,
    videoId: video.id,
  });

  const { error } = await supabase.from('analysis_results').insert({
    user_id: userId,
    session_id: sessionId,
    video_id: video.id,
    angle: video.angle,
    symmetry_score: serverResult.symmetry_score,
    issues: serverResult.issues,
    keypoints: serverResult.keypoints ?? null,
  });

  if (error) throw error;

  return {
    angle: video.angle,
    symmetry_score: serverResult.symmetry_score,
    issues: serverResult.issues,
    keypoints: serverResult.keypoints ?? [],
    storagePath: video.storage_path,
  };
}

/**
 * Analyze all videos in a session (parallel with Promise.allSettled).
 * Updates gym_sessions.analysis_status throughout.
 * Returns array of per-angle results (successful ones).
 */
export async function analyzeSession(sessionId, userId) {
  // Set status to analyzing
  await supabase
    .from('gym_sessions')
    .update({ analysis_status: 'analyzing' })
    .eq('id', sessionId);

  // Fetch all videos for this session
  const { data: videos, error: fetchErr } = await supabase
    .from('session_videos')
    .select('*')
    .eq('session_id', sessionId);

  if (fetchErr || !videos?.length) {
    await supabase
      .from('gym_sessions')
      .update({ analysis_status: 'failed' })
      .eq('id', sessionId);
    throw new Error(fetchErr?.message || 'No videos found for session');
  }

  // Analyze all angles in parallel
  const settled = await Promise.allSettled(
    videos.map((video) => analyzeVideo(video, userId, sessionId))
  );

  const results = [];
  let hasFailure = false;

  for (const outcome of settled) {
    if (outcome.status === 'fulfilled') {
      results.push(outcome.value);
    } else {
      hasFailure = true;
      console.warn('Analysis failed for one angle:', outcome.reason);
    }
  }

  // Update session status
  const finalStatus = results.length === 0 ? 'failed' : 'complete';
  await supabase
    .from('gym_sessions')
    .update({ analysis_status: finalStatus })
    .eq('id', sessionId);

  return { results, hasFailure };
}
