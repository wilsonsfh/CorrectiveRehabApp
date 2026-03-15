# CorrectiveRehabApp — Gym Biomechanical Audit Tool Roadmap

## Vision
A gym-specific biomechanical audit tool that catches invisible form breaks, tracks asymmetries, and correlates daily posture habits with gym performance. Not general wellness — **performance optimization and symmetry**.

## Core Value Proposition
"Stop Training Around Your Weaknesses." AI-driven video auditing to see the asymmetries you can't feel. Log habits, record sets, build a balanced body.

---

## Model Usage Guide
- **Opus**: Phases 1 & 4 — architecture/system design, schema decisions, AI pipeline design
- **Sonnet**: Phases 2, 3, 5, 6 — implementation, UI, feature work
- Rule: If phase defines a contract other phases depend on → Opus. If it consumes an existing contract → Sonnet.

## Phase 0 — Identity & Branding Pivot *(COMPLETE)*
- Keep name: **CorrectiveRehabApp**
- Update theme colors: gym/performance aesthetic vs clinical/rehab
- Rewrite Home screen copy: "CRUSH YOUR ASYMMETRY" vibe
- Mobile-first responsive design
- New hero, feature sections, competitive edge messaging

## Phase 1 — Core Data & Persistence
- Supabase setup: auth + Postgres
- Replace mock data with real CRUD
- AsyncStorage for offline-first habit logging (sync when online)
- Data models: `users`, `habit_logs`, `workout_sessions`, `video_recordings`, `form_scores`

## Phase 2 — Gym-Specific Habit Tracker
- Replace generic habits with gym-relevant defaults: "Left-Side Shift", "Ankle Cave", "Hip Hike", "Shoulder Shrug Imbalance", "Forward Lean"
- Habit-to-gym-impact mapping (e.g. "Sat cross-legged 3h" → "Right hip flexor tight → expect squat shift")
- Push notifications: "You've been sitting 2h — do hip flexor release before leg day"

## Phase 3 — Video Logger with Multi-Angle Prompting
- Camera integration via `expo-camera` or `react-native-vision-camera`
- Lift selection screen: Squat, Deadlift, Bench, OHP, etc.
- Prompted recording: "Film from SIDE for bar path" → "Film from FRONT for symmetry"
- Video saved locally + uploaded to Supabase Storage

## Phase 4 — AI Pose Estimation & Form Scoring
- **On-device (primary)**: MediaPipe via react-native-vision-camera frame processor — free, offline, real-time skeleton overlay
- **Server-side (deep audit)**: Recorded video upload → OpenPose/skeleton extraction → classification scores
- Joint angle calculation (knee, hip, shoulder)
- Symmetry score: left vs right comparison
- Auto-detection: butt wink, knee cave, bar drift, hip shift

## Phase 5 — Dashboard & Progress Tracking
- Symmetry Score trending over time (charts)
- Side-by-side video comparison (Week 1 vs Week 4)
- Habit correlation: "Days you sat >4h, squat symmetry dropped 12%"
- Progressive form score per lift

## Phase 6 — Exercise Library Revamp
- Corrective drills mapped to detected issues
- AI suggestions: "Squat showed left hip shift → Try: Single-Leg RDL, Cossack Squat, Banded Clamshell"
- Video demos for each corrective exercise

---

## Distribution & Testing Strategy

### Expo Go (Phase 0–2 testing)
- Install Expo Go on mobile once → scan QR code
- Both Mac and phone must be on **same WiFi** for fast LAN mode
- Tunnel mode (`--tunnel`) works across networks but is slower
- First load is always slow (Metro bundles JS) — subsequent loads are faster
- **No Expo login required** on Mac to run a local project (login only needed for EAS cloud builds)

### EAS Build (Phase 3+ when camera/ML needed)
- `eas build --platform android` → direct `.apk` download link (Android sideload, no Play Store)
- `eas build --platform ios` → TestFlight (iOS, requires Apple Developer account)

### Expo Web (optional parallel)
- Runs in browser, zero install
- Limited: no camera/pose estimation — only habit logging + library work
- Good for a marketing/landing page

### Auth (Phase 1)
- **Supabase Auth** — email/password + Google OAuth, integrates with Supabase DB
- Expo Auth Session for OAuth redirect flows

## Tech Stack
| Layer | Choice |
|-------|--------|
| Mobile | React Native + Expo 54 |
| Pose Estimation | MediaPipe (on-device) + optional server pipeline |
| Backend | Supabase (Auth + Postgres + Storage + Edge Functions) |
| Video Processing | FFmpeg (server-side via Edge Function) |
| AI Deep Analysis | Google Cloud Vision or custom TFLite model (later) |
| Language | JavaScript/TypeScript |

## Differentiator
Gait analysis is underserved on the consumer side — most apps focus on static posture photos. This app targets **dynamic movement under load** in the gym.
