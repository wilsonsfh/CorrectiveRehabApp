# CorrectiveRehabApp

Gym biomechanical audit tool — AI-driven video analysis to catch asymmetries and form breaks under load.

## Current State

- **Branch:** `phase-4`
- **Completed:** Phases 0–4a
- **Next up:** Phase 4b (skeleton overlay + frame stepper), then 4c (session comparison)

## Tech Stack

| Layer | Choice |
|---|---|
| Mobile | React Native + Expo 54 (JavaScript) |
| Camera | expo-camera v17 |
| Video | expo-video v3 |
| Backend | Supabase (Auth + Postgres + Storage) |
| Analysis Server | FastAPI + MediaPipe on Google Cloud Run |
| Video Processing | FFmpeg (server-side) + OpenCV |

## Project Structure

```
src/
  screens/         # All app screens (HomeScreen, RecordVideoScreen, etc.)
  navigation/      # AppNavigator.js (RootStack + bottom tabs)
  lib/             # Helpers (supabase.js, analysis.js, mockData.js)
  components/      # Reusable components
server/            # Python FastAPI server (analysis.py, main.py)
docs/plans/        # Design documents per phase
supabase-schema.sql
```

## Key Files

- `src/lib/analysis.js` — Client-side analysis orchestration (calls server, writes results)
- `server/analysis.py` — MediaPipe pose estimation + symmetry scoring (8 issue types)
- `server/main.py` — FastAPI app with `/analyze` endpoint
- `src/screens/SessionResultScreen.js` — Per-angle score breakdown
- `src/screens/RecordVideoScreen.js` — Multi-angle video recorder
- `src/screens/VideoPreviewScreen.js` — Preview + upload to Supabase Storage
- `ROADMAP.md` — Full phase breakdown and tech decisions

## Phase Roadmap

| Phase | Status | Description |
|---|---|---|
| 0 | COMPLETE | Identity & branding pivot |
| 1 | COMPLETE | Supabase auth + persistence |
| 2 | COMPLETE | Gym-specific habit tracker |
| 3 | COMPLETE | Multi-angle video recorder |
| 4a | COMPLETE | Server-side pose estimation + scoring |
| 4b | DESIGNED | Skeleton overlay + frame stepper |
| 4c | DESIGNED | Side-by-side session comparison |
| 5 | PLANNED | Dashboard, trends, history |
| 6 | PLANNED | Exercise library revamp |

## Design Docs

- `docs/plans/2026-03-16-phase4-design.md` — Phase 4a design
- `docs/plans/2026-03-16-phase4bc-design.md` — Phase 4b/4c design

## Environment

- `.env` contains `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_ANALYSIS_SERVER_URL`
- Server deployed at Cloud Run URL (see `.env`)
- EAS builds required for camera features (not Expo Go)

## Conventions

- JavaScript (not TypeScript) throughout
- Screens are functional components with hooks
- Supabase RLS on all tables (user_id scoping)
- Analysis server uses service key (bypasses RLS for video download)
- Model usage: Opus for architecture/design phases, Sonnet for implementation
