# Phase 4a Design: Server-Side Pose Estimation + Scoring

## Context

Phase 3 delivered multi-angle video recording with Supabase Storage. Users record Side, Front, and Above angles of 6 lift types. Videos are stored at `session-videos/{user_id}/{session_id}/{angle}.mp4`. HomeScreen has a hardcoded symmetry score (74/100) waiting for real data.

Phase 4a adds AI-powered form analysis: a Python server processes uploaded videos using MediaPipe Pose, returns symmetry scores and detected asymmetries, and populates the HomeScreen score card with real data.

## Design Decisions

1. **Server-side analysis first** — no on-device ML in Phase 4a. Skeleton overlay and on-device preview feedback deferred to Phase 4b/4c.
2. **Client-initiated pipeline** — app calls Python server directly after session save. No webhooks, triggers, or queues.
3. **FastAPI + MediaPipe on Google Cloud Run** — standard Python ML stack, free tier (2M req/mo, scales to zero).
4. **Scores stored in `analysis_results` table** — one row per angle per session.
5. **New `SessionResultScreen`** — shows per-angle breakdown after analysis completes.

## Architecture

```
User records video → Upload to Supabase Storage
                         ↓
         LinkSessionScreen "Save Session"
                         ↓
         App calls Python server POST /analyze
         with { storage_path, category_id, angle, user_id, session_id, video_id }
                         ↓
         Python server:
           1. Downloads video from Supabase Storage (signed URL)
           2. Extracts keyframes (every Nth frame)
           3. Runs MediaPipe Pose Landmarker on each frame
           4. Calculates symmetry metrics
           5. Returns JSON { symmetry_score, issues, keypoints }
                         ↓
         App writes to analysis_results table
                         ↓
         Navigate to SessionResultScreen (per-angle breakdown)
                         ↓
         HomeScreen reads real aggregate score
```

## Python Server

### Stack
- **Framework:** FastAPI
- **ML:** MediaPipe Pose Landmarker (Python SDK)
- **Video processing:** OpenCV (cv2) for frame extraction
- **Hosting:** Google Cloud Run (free tier — 2M requests/mo, 360K vCPU-sec, scales to zero)
- **Auth:** Supabase service key for Storage access (server-side only)

### Endpoints

#### `POST /analyze`

**Request:**
```json
{
  "storage_path": "user-id/session-id/side.mp4",
  "category_id": "squat",
  "angle": "side",
  "user_id": "uuid",
  "session_id": "uuid",
  "video_id": "uuid"
}
```

**Response:**
```json
{
  "symmetry_score": 72,
  "issues": [
    {
      "id": "forward_lean",
      "label": "Forward Lean",
      "severity": "moderate",
      "detail": "Torso angle exceeds 45° at bottom of squat. Likely ankle mobility or core bracing deficit.",
      "measurement": { "angle_degrees": 52, "threshold": 45 }
    },
    {
      "id": "hip_shift",
      "label": "Left-Side Shift",
      "severity": "mild",
      "detail": "Left hip drops 4° below right at parallel. Minor but consistent across frames.",
      "measurement": { "delta_degrees": 4, "threshold": 8 }
    }
  ],
  "keypoints": null
}
```

### Analysis Logic Per Angle

**Side angle:**
- Bar path linearity (deviation from vertical)
- Forward lean angle (torso vs vertical at bottom position)
- Hip-knee-ankle alignment (depth assessment)
- Butt wink detection (lumbar flexion at bottom)

**Front angle:**
- Left-right hip symmetry (hip hike detection)
- Knee cave angle (valgus measurement)
- Shoulder levelness (shrug detection)
- Weight distribution (hip shift detection)

**Above angle:**
- Bar rotation (wrist symmetry)
- Grip width consistency

### Issue ID Mapping

Issues map directly to the existing `GYM_HABITS` from `mockData.js`:

| MediaPipe Detection | Issue ID | GYM_HABIT |
|---|---|---|
| Hip asymmetry | `hip_shift` | Left-Side Shift |
| Knee valgus | `ankle_cave` | Ankle Cave |
| Hip drop | `hip_hike` | Hip Hike |
| Shoulder asymmetry | `shoulder_shrug` | Shoulder Shrug |
| Torso angle | `forward_lean` | Forward Lean |
| Lumbar flexion | `butt_wink` | Butt Wink |

## Database Schema

### New table: `analysis_results`

```sql
create table public.analysis_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  session_id uuid references public.gym_sessions(id) on delete cascade not null,
  video_id uuid references public.session_videos(id) on delete cascade not null,
  angle text not null,
  symmetry_score int not null check (symmetry_score between 0 and 100),
  issues jsonb default '[]',
  keypoints jsonb,
  processed_at timestamptz default now()
);

alter table public.analysis_results enable row level security;

create policy "Users own analysis_results" on public.analysis_results
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index idx_analysis_results_session on public.analysis_results(session_id);
create index idx_analysis_results_user on public.analysis_results(user_id, processed_at desc);
```

### Add `analysis_status` to `gym_sessions`

```sql
alter table public.gym_sessions
  add column if not exists analysis_status text default 'pending'
    check (analysis_status in ('pending', 'analyzing', 'complete', 'failed'));
```

## App Changes

### New Files

| File | Purpose |
|---|---|
| `server/` | Python FastAPI server (separate directory or repo) |
| `server/main.py` | FastAPI app with `/analyze` endpoint |
| `server/analysis.py` | MediaPipe pose estimation + scoring logic |
| `server/requirements.txt` | Dependencies (fastapi, mediapipe, opencv-python, supabase) |
| `server/Dockerfile` | Container image for Cloud Run deployment |
| `src/lib/analysis.js` | Client-side helper to call the analysis API |
| `src/screens/SessionResultScreen.js` | Per-angle score breakdown screen |

### Modified Files

| File | Change |
|---|---|
| `src/screens/LinkSessionScreen.js` | After save, trigger analysis for each angle, navigate to SessionResultScreen |
| `src/screens/HomeScreen.js` | Replace hardcoded 74/100 with real aggregate score from `analysis_results` |
| `src/navigation/AppNavigator.js` | Add `SessionResult` modal screen |
| `supabase-schema.sql` | Add `analysis_results` table + `analysis_status` column |

### LinkSessionScreen Flow (Updated)

```
handleConfirm():
  1. Mark session complete (existing)
  2. Insert habit logs (existing)
  3. Set analysis_status = 'analyzing'
  4. Navigate to SessionResultScreen with { sessionId, category, recordedAngles }
  5. SessionResultScreen calls POST /analyze for each angle
  6. Shows progress: "Analyzing side angle... (1/3)"
  7. Writes results to analysis_results table
  8. Displays scores when all angles complete
```

### HomeScreen Score Card (Updated)

Replace hardcoded values:
- Fetch most recent `analysis_results` for the user
- Average `symmetry_score` across all angles in the latest session
- Trend: compare latest session score to previous session score
- If no analysis results exist, show "Record a set to get your score"

### SessionResultScreen

**Header:** "FORM ANALYSIS" + category label
**Per-angle cards:**
- Angle name + score (e.g., "SIDE: 72/100")
- Progress bar with color gradient (red → orange → green)
- List of detected issues with severity badges
- Detail text for each issue

**Overall score:** Average across all angles
**CTA:** "Done" → popToTop()

## Server Deployment

### Google Cloud Run Setup

**Prerequisites:** `gcloud` CLI installed, GCP project created.

```bash
# 1. Authenticate and set project
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# 2. Deploy from server/ directory (builds container automatically)
cd server
gcloud run deploy corrective-rehab-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --timeout 120 \
  --min-instances 0 \
  --max-instances 3 \
  --set-env-vars SUPABASE_URL=your-url,SUPABASE_SERVICE_KEY=your-key

# 3. Note the service URL from output (https://corrective-rehab-api-xxxxx.run.app)
```

**Environment variables (set via `--set-env-vars` or Cloud Console):**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY` (service role key — server-side only, bypasses RLS for video download)

**Key settings:**
- `--memory 1Gi` — MediaPipe + OpenCV need ~512MB, 1Gi gives headroom
- `--min-instances 0` — scales to zero when idle (free tier friendly)
- `--max-instances 3` — prevents runaway costs
- `--timeout 120` — video processing can take 30-60s
- `--allow-unauthenticated` — app authenticates via Supabase JWT, not GCP IAM

### App Config
- Add `EXPO_PUBLIC_ANALYSIS_SERVER_URL` to `.env` (the Cloud Run service URL)
- `src/lib/analysis.js` reads this URL

## Out of Scope (Phase 4b/4c)

- On-device ML during recording/preview (Phase 4b)
- Skeleton overlay on video playback (Phase 4c)
- Video playback history screen (Phase 5)
- Category-level aggregation / trend charts (Phase 5)
- Raw keypoints storage for replay (Phase 4c)

## Verification

1. Record a Squat session (Side + Front angles)
2. Save session → "Analyzing..." screen appears
3. Each angle processes (10-30s per angle)
4. SessionResultScreen shows per-angle scores + detected issues
5. "Done" → HomeScreen shows real symmetry score (no longer 74)
6. Record another session → HomeScreen trend shows change
7. Profile tab → stats still work
