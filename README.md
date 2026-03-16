# CorrectiveRehabApp

> **"Stop Training Around Your Weaknesses."**
> AI-driven video analysis that catches the asymmetries you can't feel — under load, in motion, in the gym.

---

## Why This Exists

Most gym injuries aren't accidents. They're the slow accumulation of ignored asymmetries — a hip that shifts 4° on every squat rep, a knee that caves inward on every deadlift. These patterns are invisible to the naked eye and unfelt by the lifter until something breaks.

Existing tools either require lab-grade equipment (force plates, motion capture suits) or rely on static posture photos that miss the entire point: **form breaks happen under load, not standing still.**

CorrectiveRehabApp targets the gap: **AI-powered video auditing for the gym, on your phone, built from scratch.**

---

## What It Does

Record your sets from multiple angles. The app uploads the videos to a cloud analysis server running MediaPipe Pose, which extracts 33-point skeletal landmarks from each frame, calculates symmetry metrics, and returns:

- A **symmetry score** (0–100) per angle
- Detected **form issues** with severity ratings (mild / moderate / severe)
- **Raw keypoints** for skeleton visualization
- **Issue-specific detail** — not just "knee cave detected" but "knee valgus angle of 14.3° detected"

The results are stored per session, enabling trend tracking over time and side-by-side comparison between sessions.

---

## Impact & Motivation

**The problem is real and widespread.** Studies estimate that 30–50% of recreational lifters experience overuse injuries annually, most of which are biomechanically preventable. A 2018 study in the *Journal of Strength and Conditioning Research* found that knee valgus during squats was present in 82% of recreational lifters but self-reported by only 23% of them — a massive blind spot.

**The market gap is clear.** Sports teams and physical therapists have access to expensive motion capture systems. Consumer apps offer static photo analysis or basic rep counting. Nothing bridges the gap between "film yourself at the gym" and "understand what's wrong with your form" in real time.

**The personal motivation.** This project started from a recurring lower back injury during deadlifts that went undetected for months — a consistent hip shift that no mirror could catch. The goal was to build the tool that would have caught it in week one.

---

## Key Stats

| Metric | Value |
|---|---|
| MediaPipe landmarks tracked per frame | 33 |
| Keyframes analyzed per video | ~15 |
| Form issue types detected | 8 |
| Lift categories supported | 6 (Squat, Deadlift, Bench, OHP, Row, Lunge) |
| Camera angles per session | Up to 3 (Side, Front, Above) |
| Analysis time per video | 10–30s |
| Server cost (Cloud Run free tier) | $0 (2M req/mo included) |
| Total phases shipped | 7 (0 through 4c) |
| Lines of app code written | ~5,000+ |

---

## Detected Issues

| Issue | Angle | What It Measures |
|---|---|---|
| Forward Lean | Side | Torso angle vs vertical at bottom of squat |
| Butt Wink | Side | Lumbar flexion at depth |
| Hip Shift | Front | Lateral displacement of hip center vs shoulder center |
| Hip Hike | Front | Vertical height difference between left and right hips |
| Ankle Cave (Knee Valgus) | Front | Knee deviation from hip-ankle line |
| Shoulder Shrug | Front | Vertical shoulder imbalance |
| Bar Rotation | Above | Wrist line angle vs shoulder line |
| Wrist Asymmetry | Above | Distance asymmetry from each wrist to its shoulder |

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Mobile | React Native + Expo 54 | Cross-platform, fast dev iteration |
| Camera | expo-camera v17 | Managed Expo, works in dev builds |
| Video playback | expo-video v3 | Frame extraction support via expo-video-thumbnails |
| Skeleton rendering | react-native-svg | SVG primitives, scales to any frame size |
| Frame extraction | expo-video-thumbnails | Client-side extraction by timestamp |
| Auth + DB | Supabase (Postgres + RLS) | Built-in auth, row-level security, no custom backend needed |
| Video storage | Supabase Storage | Integrated auth, signed URL access |
| Analysis server | FastAPI + MediaPipe on Cloud Run | Python ML ecosystem, scales to zero (no idle cost) |
| Video pre-processing | FFmpeg + OpenCV | moov atom fix for iOS .mov files, frame extraction |

---

## Architecture

```
User records video (expo-camera)
        ↓
Upload to Supabase Storage
  session-videos/{user_id}/{session_id}/{angle}.mp4
        ↓
App calls POST /analyze on Cloud Run server
  { storage_path, category_id, angle, user_id, session_id, video_id }
        ↓
Server pipeline:
  1. Download video from Supabase Storage (service key)
  2. ffmpeg remux → fix iOS moov atom
  3. OpenCV → extract ~15 evenly-spaced keyframes
  4. MediaPipe Pose Landmarker (model_complexity=2) → 33 landmarks per frame
  5. Angle-specific analysis (side / front / above)
  6. Symmetry score + issues + raw keypoints
        ↓
App writes results to analysis_results table (user JWT, RLS enforced)
        ↓
SessionResultScreen: per-angle score cards + skeleton thumbnails
        ↓ tap any angle card
SkeletonViewerScreen: frame stepper + SVG skeleton, issue coloring
        ↓ "Compare to Previous" (if prior session exists)
CompareSessionScreen: side-by-side, score delta, issue diff
```

---

## Phase History

### Phase 0 — Identity & Branding *(complete)*
Rewrote the visual identity from clinical/rehab to gym/performance. Dark industrial theme (`#0D0F1A` background, `#00E5CC` electric cyan accent), "CRUSH YOUR ASYMMETRY" copy, mobile-first responsive layout. Set the visual language for everything that followed.

### Phase 1 — Core Data & Persistence *(complete)*
Supabase auth (email OTP + Google OAuth), Postgres schema with RLS on every table, AsyncStorage for offline-first habit logging. Replaced all mock data with live CRUD. Established the data contract other phases depend on.

**Schema:** `users`, `habit_logs`, `gym_sessions`, `session_videos`, `analysis_results`

### Phase 2 — Gym-Specific Habit Tracker *(complete)*
Replaced generic wellness habits with gym-relevant defaults: Left-Side Shift, Ankle Cave, Hip Hike, Shoulder Shrug Imbalance, Forward Lean, Butt Wink. Each habit maps to a predicted gym impact. Push notifications fire on non-gym days with exercise-specific reminders ("You've been sitting 2h — do hip flexor release before leg day"). Deep links pre-fill the habit log.

### Phase 3 — Multi-Angle Video Recorder *(complete)*
Full guided recording flow: lift category selection → angle-by-angle prompting ("FILM FROM THE SIDE — Capture bar path and depth from 90°") → preview → upload to Supabase Storage. Draft session system persists partially recorded sessions. Videos stored at `session-videos/{user_id}/{session_id}/{angle}.mp4`.

### Phase 4a — Server-Side Pose Estimation *(complete)*
The core AI pipeline. FastAPI server on Google Cloud Run. On each `POST /analyze`:
- Downloads the video from Supabase Storage using the service key
- ffmpeg remux to fix iOS `.mov → .mp4` moov atom issues
- OpenCV extracts ~15 keyframes
- MediaPipe Pose Landmarker (full model) runs on each frame
- Angle-specific analysis returns scores + issues with measurements

Scoring deducts per issue: severe (−20), moderate (−12), mild (−5), floored at 0. HomeScreen replaced hardcoded "74/100" with real aggregate from the DB.

**Added:** `analysis_results` table, `analysis_status` column on `gym_sessions`, `session_videos` foreign keys.

### Phase 4b — Skeleton Overlay + Frame Stepper *(complete)*
The server now returns raw keypoints (33 landmarks × ~15 frames) alongside scores. The app:
- Renders skeleton thumbnails on each angle card (mid-frame + SVG overlay)
- `SkeletonViewerScreen`: full-screen frame stepper, Prev/Next through analyzed keyframes
- `SkeletonOverlay` component: issue-aware joint coloring (teal → orange → red by severity), optional angle measurement labels
- `expo-video-thumbnails` extracts frame images at each keyframe's timestamp

**Added:** `src/components/SkeletonOverlay.js`, `src/screens/SkeletonViewerScreen.js`, deps: `react-native-svg`, `expo-video-thumbnails`.

### Phase 4c — Side-by-Side Session Comparison *(complete)*
After any analyzed session, the app queries for the most recent prior session with the same lift category. If found, a "Compare to Previous" button appears on the results screen. `CompareSessionScreen` shows:
- Score delta badge (e.g., "68 → 75, **+7**" in green)
- Side-by-side skeleton frames with independent frame navigation
- Issue diff: improved / regressed / resolved / new — each with icon and color

**Added:** `src/screens/CompareSessionScreen.js`.

---

## Project Structure

```
/
├── src/
│   ├── screens/          # All app screens
│   ├── components/       # SkeletonOverlay (reusable SVG renderer)
│   ├── navigation/       # AppNavigator (RootStack + bottom tabs)
│   ├── lib/              # supabase.js, analysis.js, linking.js
│   ├── data/             # mockData.js (LIFT_CATEGORIES, GYM_HABITS)
│   └── constants/        # theme.js (COLORS, SPACING, RADIUS, SHADOWS)
├── server/
│   ├── main.py           # FastAPI app, /analyze endpoint + Pydantic models
│   ├── analysis.py       # MediaPipe pose estimation + 8 issue detectors + scoring
│   ├── Dockerfile        # Cloud Run container image
│   ├── deploy.sh         # One-command gcloud run deploy
│   └── requirements.txt  # fastapi, mediapipe, opencv-python-headless, httpx
├── docs/plans/           # Design documents per phase
├── supabase-schema.sql   # Full DB schema with RLS policies
├── ROADMAP.md            # Detailed phase breakdown and tech decisions
└── CLAUDE.md             # Project context for AI-assisted development
```

---

## Running Locally

**Prerequisites:** Node.js, Expo CLI, Supabase project, Google Cloud project with Cloud Run enabled.

```bash
# Install dependencies
npm install

# Environment variables
cp .env.example .env
# Set: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY,
#      EXPO_PUBLIC_ANALYSIS_SERVER_URL

# Run (Expo Go — habit logging and UI work; camera needs dev build)
npx expo start

# Dev build for full camera + video features
npx expo run:ios --device

# Deploy analysis server
cd server
# Create server/.env.deploy with: SUPABASE_SERVICE_KEY=your-service-key
bash deploy.sh
```

**Supabase setup:**
1. Run `supabase-schema.sql` in Supabase Dashboard → SQL Editor
2. Create Storage bucket: `session-videos` (private)
3. Add storage RLS policies for user isolation
4. Configure SMTP for OTP email (Resend or Mailgun)

---

## Roadmap

| Phase | Status | Description |
|---|---|---|
| 0 | ✅ Complete | Identity & branding |
| 1 | ✅ Complete | Supabase auth + persistence |
| 2 | ✅ Complete | Gym-specific habit tracker |
| 3 | ✅ Complete | Multi-angle video recorder |
| 4a | ✅ Complete | Server-side pose estimation + scoring |
| 4b | ✅ Complete | Skeleton overlay + frame stepper |
| 4c | ✅ Complete | Side-by-side session comparison |
| 5 | 🔜 Next | Dashboard, symmetry trends, session history |
| 6 | 📋 Planned | Exercise library with AI-mapped corrective drills |

---

## Differentiator

Most posture/movement apps analyze static photos or use consumer-grade wearables. This app targets **dynamic movement under load** — the exact moment form breaks down — using the same pose estimation technology as professional sports analytics pipelines, running from a phone camera, for free.

The feedback isn't "your posture is bad." It's "your left hip shifts 6.2% of hip width during the descent phase of every squat. Here's the frame. Here's the severity. Here's what changed since last week."

That specificity is the point.
