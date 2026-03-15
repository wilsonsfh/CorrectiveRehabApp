# CorrectiveRehabApp

**AI-powered biomechanical auditing for lifters.** Stop training around your weaknesses. Log your asymmetries, record your sets, and build a body as balanced as it is strong.

## What This Does

CorrectiveRehabApp is a gym-specific form audit tool that catches the invisible breaks in your lifting mechanics — the ones your body hides from you until they cause injury or stall your progress.

- **Log asymmetries** during lifts (left-side shift, knee cave, hip hike, shoulder shrug, butt wink, forward lean)
- **Correlate daily posture habits** with gym performance
- **Get AI-powered form feedback** on recorded videos (Phase 4+)
- **Track symmetry scores** over time to measure improvements

## Features (Phase 0)

- **Form Library**: 6 corrective drills mapped to specific asymmetries
- **Habit Tracker**: Log gym-specific issues with contextual gym impact explanations
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
- **React Navigation 7** — bottom-tab routing
- **Expo Video** — video playback
- **Lucide React Native** — icons
- **Expo Linear Gradient** — UI effects

## Roadmap

| Phase | Focus | Status |
|-------|-------|--------|
| **0** | Identity, branding, dark UI | ✅ Complete |
| **1** | Supabase auth + Postgres persistence | 🔄 Next (Opus) |
| **2** | Gym-specific habit tracker with push notifications | 🎯 Phase 2 |
| **3** | Video logger with multi-angle recording | 🎯 Phase 3 |
| **4** | AI pose estimation (MediaPipe on-device + server pipeline) | 🎯 Phase 4 |
| **5** | Dashboard with symmetry trends and video comparison | 🎯 Phase 5 |
| **6** | Corrective exercise library revamp (AI-suggested drills) | 🎯 Phase 6 |

## Why This Matters

Gait analysis and dynamic form feedback are **underserved on the consumer side**. Most apps focus on static posture photos. This app targets lifters during compound movements under load — where asymmetries actually hide and cause damage.

## Distribution

- **Testing**: Expo Go (QR scan, no install friction)
- **Phase 3+**: EAS Build → TestFlight (iOS) or direct `.apk` (Android)
- **Auth**: Supabase Auth (email/password + OAuth)

## Notes

- Metro bundler slow on first load — normal, subsequent reloads are fast
- Make sure phone and Mac are on **same WiFi** for LAN mode (fastest)
- Use `--tunnel` if LAN doesn't work
