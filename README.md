# CorrectiveRehabApp

**AI-powered biomechanical auditing for lifters.** Stop training around your weaknesses. Log your asymmetries, record your sets, and build a body as balanced as it is strong.

## What This Does

CorrectiveRehabApp is a gym-specific form audit tool that catches the invisible breaks in your lifting mechanics — the ones your body hides from you until they cause injury or stall your progress.

- **Log asymmetries** during lifts (left-side shift, knee cave, hip hike, shoulder shrug, butt wink, forward lean)
- **Correlate daily posture habits** with gym performance
- **Get AI-powered form feedback** on recorded videos (Phase 4+)
- **Track symmetry scores** over time to measure improvements

## Features (Phase 0–3)

- **Email OTP Authentication** (Phase 1): Magic-link-free passwordless login via Supabase Auth
- **Habit Logger** (Phase 1–2): Log gym-specific asymmetries + off-gym daily habits with smart notifications
- **Push Notifications** (Phase 2): Gym-aware reminders on non-gym days with deep-link habit pre-fill
- **Video Recorder** (Phase 3): Multi-angle gym set recording (Side, Front, Above) with Supabase Storage
- **Smart Session Templates** (Phase 3): Fetch & pre-fill from last completed session of same exercise
- **Form Library**: 6 corrective drills mapped to specific asymmetries
- **Symmetry Score**: Dashboard view of your current symmetry baseline
- **Dark industrial UI**: Precision-focused, performance-oriented design

## Setup

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your phone (same WiFi). First load is slow (Metro bundling) — subsequent loads are instant.

If slow or connectivity issues:
```bash
npx expo start --tunnel
```

## Tech Stack

- **React Native 0.81** + **Expo 54** — mobile framework
- **React Navigation 7** — tab + modal routing
- **Supabase** — auth (OTP), Postgres (RLS), Storage (video uploads)
- **Expo Camera** — video recording with multi-angle prompting
- **Expo Notifications** — local push notifications (on non-gym days)
- **Expo Video** — video playback
- **Lucide React Native** — icons
- **Expo Linear Gradient** — UI effects
- **EAS Build** — native module compilation (Phase 3+ camera support)

## Roadmap

| Phase | Focus | Status |
|-------|-------|--------|
| **0** | Identity, branding, dark UI | ✅ Complete |
| **1** | Supabase auth (OTP) + Postgres persistence (RLS) | ✅ Complete |
| **2** | Gym-specific habit tracker + push notifications (smart scheduling) | ✅ Complete |
| **3** | Video logger: multi-angle recording (Side/Front/Above) + Supabase Storage + smart templates | ✅ Complete |
| **4** | AI pose estimation (MediaPipe on-device + server pipeline) | 🎯 Next |
| **5** | Video playback history + symmetry trends + video comparison | 🎯 Phase 5 |
| **6** | Corrective exercise library revamp (AI-suggested drills) | 🎯 Phase 6 |

## Why This Matters

Gait analysis and dynamic form feedback are **underserved on the consumer side**. Most apps focus on static posture photos. This app targets lifters during compound movements under load — where asymmetries actually hide and cause damage.

## Distribution

- **Phase 0–2**: Expo Go (QR scan, no install friction)
- **Phase 3+**: EAS Build required — camera native modules not supported in Expo Go
  - `eas build --platform ios` → TestFlight
  - `eas build --platform android` → direct `.apk` or Google Play
- **Backend**: Supabase Auth (OTP email), Postgres (RLS-protected tables), Storage (private video bucket)

## Development Notes

### Phases 0–2 (Expo Go)
- Metro bundler slow on first load — normal, subsequent reloads are fast
- Make sure phone and Mac are on **same WiFi** for LAN mode (fastest)
- Use `npx expo start --tunnel` if LAN doesn't work

### Phase 3+ (EAS Build Required)
- **Camera**: expo-camera requires native modules; build with EAS (`eas build`)
- **Supabase setup**:
  - Run SQL schema: `supabase-schema.sql` in Supabase Dashboard → SQL Editor
  - Create Storage bucket: `session-videos` (private)
  - Add storage RLS policies for user isolation
  - Configure SMTP for OTP email (Resend or Mailgun)
- **Video Storage**: Videos uploaded to `session-videos/{user_id}/{session_id}/{angle}.mp4`
- **Database**: `gym_sessions` (draft/complete status) + `session_videos` (angle tracking) + RLS policies
