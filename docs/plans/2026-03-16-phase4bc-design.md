# Phase 4b/4c Design: Skeleton Overlay + Session Comparison

## Context

Phase 4a delivered server-side pose estimation via FastAPI + MediaPipe on Google Cloud Run. Users record multi-angle videos, upload to Supabase Storage, and get symmetry scores + detected issues back. The `analysis_results` table has a `keypoints` column that is currently always `null`.

Phase 4b adds skeleton visualization: the server returns raw keypoints, SessionResultScreen shows skeleton thumbnails per angle, and a drill-down frame stepper lets users inspect each analyzed frame with annotated overlays.

Phase 4c adds side-by-side session comparison for the same lift.

## Design Decisions

1. **Server returns keypoints, no on-device ML** — The server already computes landmarks via MediaPipe. Just return them instead of discarding. No new ML dependencies on the client. Tradeoff: requires connectivity + server round-trip before skeleton is visible. Acceptable because users already upload videos to Supabase (online required anyway).
2. **Frame stepper, not video playback** — Show the ~15 analyzed keyframes as still images with skeleton overlay. Prev/Next to step through. Honest (every frame shown has real data), simple (no interpolation), and lightweight.
3. **react-native-svg for skeleton rendering** — Lines + circles drawn over frame images. Reusable component for both thumbnails and full-screen viewer.
4. **Issue-aware coloring** — Joints/segments involved in detected issues are color-coded by severity. Optional "Show Measurements" toggle for angle values.
5. **"Compare to Previous" as quick path** — Auto-selects most recent prior session for same lift. Full history picker deferred to Phase 5.

## Architecture

### Phase 4b Data Flow

```
Server processes video (existing)
  → NOW returns keypoints[] alongside symmetry_score + issues
  → App stores keypoints in analysis_results.keypoints column
  → SessionResultScreen renders skeleton thumbnail per angle card
  → Tap angle card → SkeletonViewerScreen
  → Frame stepper: step through ~15 frames with full skeleton overlay
```

### Phase 4c Data Flow

```
SessionResultScreen → "Compare to Previous" button
  → Query: most recent prior analysis_results for same category_id
  → CompareSessionScreen: side-by-side worst frames with skeleton
  → Score diff + issue diff (improved / regressed / new)
```

---

## Phase 4b — Skeleton Overlay + Frame Stepper

### Server Changes (analysis.py)

Modify the response to include keypoints:

```json
{
  "symmetry_score": 72,
  "issues": [...],
  "keypoints": [
    {
      "frame_index": 0,
      "timestamp_ms": 1200,
      "landmarks": [
        { "x": 0.52, "y": 0.18, "z": -0.02, "visibility": 0.99 },
        ...
      ]
    },
    ...
  ]
}
```

- `landmarks` array: 33 MediaPipe Pose landmarks per frame (normalized 0-1 coordinates)
- `frame_index`: which keyframe (0 to ~14)
- `timestamp_ms`: timestamp in the original video for frame extraction reference
- Include the extracted frame images as base64 or return frame timestamps so the client can extract them

**Frame image delivery options (decided: timestamps + client extraction):**
- Returning ~15 base64 images per angle would bloat the response (~5-10MB per angle)
- Instead: return `timestamp_ms` per keyframe, client uses `expo-video-thumbnails` to extract frames locally from the uploaded video URL
- Fallback: if thumbnail extraction fails, show skeleton on plain dark background

### Client Changes

#### 1. SessionResultScreen Enhancement

Each angle card gains a skeleton thumbnail:
- After analysis completes, fetch the "worst frame" (frame with highest issue severity)
- Extract video frame at that timestamp via `expo-video-thumbnails`
- Render `SkeletonOverlay` component on top (small scale)
- Tap card → navigate to `SkeletonViewerScreen` with full keypoints data

#### 2. New: `SkeletonOverlay` Component

Reusable SVG component (`react-native-svg`):

**Props:**
- `landmarks`: array of 33 `{x, y, z, visibility}` objects
- `issues`: array of detected issues (for color-coding)
- `width`, `height`: container dimensions
- `showMeasurements`: boolean (optional, default false)

**Rendering:**
- Draw connections between landmarks (MediaPipe Pose connection map)
- Joint circles at each landmark (radius scales with container size)
- Default color: teal (#00E5CC)
- Issue-affected segments: orange (#F59E0B) for moderate, red (#FF6B35) for severe
- When `showMeasurements` is true: render angle values near relevant joints
- Landmarks with `visibility < 0.5` rendered as dashed/faded

**Issue-to-landmark mapping:**
| Issue ID | Affected Landmarks |
|---|---|
| `forward_lean` | shoulder → hip segment |
| `butt_wink` | hip → knee segment |
| `hip_shift` | left_hip, right_hip |
| `hip_hike` | left_hip, right_hip |
| `ankle_cave` | knee → ankle segments |
| `shoulder_shrug` | left_shoulder, right_shoulder |
| `bar_rotation` | left_wrist → right_wrist line |
| `wrist_symmetry` | left_wrist, right_wrist |

#### 3. New: `SkeletonViewerScreen`

Full-screen frame stepper:

**Layout:**
- Header: angle name + frame counter ("Frame 5 / 15")
- Main: frame image with `SkeletonOverlay` rendered on top (full width)
- Controls: ← Prev | Next → buttons
- Toggle: "Show Measurements" switch
- Footer: issue summary bar for current frame (which issues are detected, severity badges)

**Behavior:**
- Loads all keyframes for the selected angle
- Extracts frame images via `expo-video-thumbnails` from Supabase Storage video URL
- Starts on the "worst frame" (same as thumbnail)
- Prev/Next steps through frames sequentially
- Issue bar updates per frame (different frames may show different severity)

**Navigation:** Modal screen, presented from SessionResultScreen

---

## Phase 4c — Side-by-Side Session Comparison

### "Compare to Previous" Button

- Appears on `SessionResultScreen` only if a prior analyzed session exists for the same `category_id`
- Query: `analysis_results WHERE user_id = X AND category_id = Y AND session_id != current ORDER BY processed_at DESC LIMIT 1`
- If no prior session: button hidden

### New: `CompareSessionScreen`

**Layout (portrait, stacked vertically):**
- Top half: Previous session's worst frame + skeleton
- Bottom half: Current session's worst frame + skeleton
- Date labels on each ("Mar 2" vs "Mar 16")

**Score comparison section:**
- Side-by-side scores: "68 → 75"
- Delta badge: "+7" in green (improved) or "-3" in red (regressed)
- Per-issue diff list:
  - Improved: "Hip Shift: severe → moderate" (green)
  - Regressed: "Forward Lean: mild → moderate" (orange)
  - Resolved: "Butt Wink: gone" (green, strikethrough)
  - New: "Ankle Cave: new (mild)" (yellow)

**Frame stepping:**
- Independent Prev/Next for each side (frame counts may differ)
- Or synchronized if both have similar frame counts

**Navigation:** Modal from SessionResultScreen

---

## New Files

| File | Phase | Purpose |
|---|---|---|
| `src/components/SkeletonOverlay.js` | 4b | Reusable SVG skeleton renderer |
| `src/screens/SkeletonViewerScreen.js` | 4b | Full-screen frame stepper |
| `src/screens/CompareSessionScreen.js` | 4c | Side-by-side comparison |

## Modified Files

| File | Phase | Change |
|---|---|---|
| `server/analysis.py` | 4b | Return keypoints array in response |
| `server/main.py` | 4b | Pass keypoints through in response schema |
| `src/lib/analysis.js` | 4b | Store keypoints from response into DB |
| `src/screens/SessionResultScreen.js` | 4b + 4c | Skeleton thumbnails on angle cards, "Compare to Previous" button |
| `src/navigation/AppNavigator.js` | 4b + 4c | Add SkeletonViewer + CompareSession screens |

## Dependencies to Add

| Package | Purpose |
|---|---|
| `react-native-svg` | Drawing skeleton lines/joints over frame images |
| `expo-video-thumbnails` | Extracting still frames from video at specific timestamps |

## Database Changes

None — `analysis_results.keypoints` column already exists (jsonb, currently null). Phase 4b populates it.

## Verification

### Phase 4b
1. Record a Squat session (Side + Front)
2. Save session → analysis runs → SessionResultScreen appears
3. Each angle card shows a thumbnail with skeleton overlay drawn on it
4. Tap an angle card → SkeletonViewerScreen opens
5. Step through ~15 frames with Prev/Next
6. Skeleton joints color-coded: teal (normal), orange (moderate issues), red (severe)
7. Toggle "Show Measurements" → angle values appear near joints
8. Issue bar at bottom updates per frame

### Phase 4c
1. Record a second Squat session (same angles)
2. SessionResultScreen now shows "Compare to Previous" button
3. Tap → CompareSessionScreen opens
4. Previous and current worst frames shown side-by-side with skeletons
5. Score delta shown (e.g., "68 → 75, +7")
6. Issue diff list: improved, regressed, new, resolved
7. Frame stepper works independently for each side

## Out of Scope (Phase 5+)

- Full session history screen with arbitrary comparison picker
- Symmetry score trend charts over time
- Habit-to-score correlation analysis
- On-device ML for instant offline preview (reconsider if server latency becomes a pain point)
- Smooth video playback with interpolated skeleton (upgrade from frame stepper)
