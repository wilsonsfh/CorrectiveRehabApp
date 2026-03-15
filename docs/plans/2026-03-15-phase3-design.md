# Phase 3 — Video Logger with Multi-Angle Prompting

## Summary
Replace the "Record Set" placeholder on HomeScreen with a real multi-angle video recording flow.
Videos stored in Supabase Storage, linked to typed gym sessions (category + date).
Smart template pre-fills habit logs from the user's last session of the same lift type.
Persistent draft state allows recording angles across separate app sessions.
Requires EAS build — expo-camera needs native modules unavailable in Expo Go.

---

## Navigation
"Record Set" on HomeScreen → modal stack (slides up, full-screen):
1. SessionSetupScreen — lift picker + smart template
2. RecordVideoScreen — camera + angle prompt
3. VideoPreviewScreen — playback, retake or accept
4. LinkSessionScreen — link to new/existing session, confirm upload

No new tab. 4-tab structure unchanged.

---

## Data Model

### New tables

```sql
-- Gym session (one lift type, one day)
create table public.gym_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  category_id text not null,
  category_label text not null,
  date date not null default current_date,
  status text default 'draft' check (status in ('draft', 'complete')),
  notes text,
  created_at timestamptz default now()
);

-- One recorded video per angle per session
create table public.session_videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  session_id uuid references public.gym_sessions(id) on delete cascade not null,
  category_id text not null,
  angle text not null check (angle in ('side', 'front', 'above')),
  storage_path text not null,
  created_at timestamptz default now()
);

-- RLS
alter table public.gym_sessions enable row level security;
alter table public.session_videos enable row level security;

create policy "Users own gym_sessions" on public.gym_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users own session_videos" on public.session_videos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Supabase Storage bucket (create manually in Dashboard)
-- Bucket name: session-videos, private
-- Path pattern: {user_id}/{session_id}/{angle}.mp4
```

### Existing tables unchanged
- `workout_sessions` — library exercise completions, untouched
- `habit_logs` — gym + daily habit logs, untouched

---

## Screen Designs

### SessionSetupScreen
- Lift category picker (chips): Squat, Deadlift, Bench Press, OHP, Barbell Row, Lunge
- Smart template section: "Last [Bench Press] session" → shows date + pre-selected habit logs
- Angles to record shown (from LIFT_CATEGORIES static data)
- "Start Recording" CTA

### RecordVideoScreen
- Full-screen camera (back camera default)
- Top banner: "FILM FROM [ANGLE]" + description of what to capture
- Large record button (tap to start, tap to stop)
- Timer display while recording
- Flip camera button

### VideoPreviewScreen
- Full-screen video playback (looping)
- "Retake" button → back to RecordVideoScreen
- "Looks Good" button → save draft, next angle or proceed to LinkSession
- Shows angle label and which angles remain

### LinkSessionScreen
- "New Session" card → creates gym_sessions row
- "Add to existing" list → today's draft sessions (if any)
- Confirm → uploads video(s) to Supabase Storage → marks session complete
- Loading state during upload

### HomeScreen addition
- "Continue Recording" banner when draft gym_session exists
- Tapping banner → reopens RecordStack at correct step

---

## Recording Flow

```
Tap "Record Set"
  → SessionSetupScreen (pick lift, see template)
  → RecordVideoScreen (angle 1, e.g. SIDE)
  → VideoPreviewScreen (retake or accept)
  → [if more angles] → RecordVideoScreen (angle 2, e.g. FRONT)
  → [if more angles] → VideoPreviewScreen
  → LinkSessionScreen (new or existing session)
  → Upload to Supabase Storage
  → Navigate to Home
```

Multi-session flow (navigate away between angles):
```
Record angle 1 → "Looks Good" → draft saved → navigate to Log tab
HomeScreen shows "Continue Recording" banner
Tap banner → SessionSetupScreen with draft pre-loaded
Record angle 2 → preview → LinkSession → complete
```

---

## Smart Template Logic

```js
// Fetch last session of same category
const lastSession = await supabase
  .from('gym_sessions')
  .select('*, habit_logs(*)')
  .eq('user_id', userId)
  .eq('category_id', categoryId)
  .eq('status', 'complete')
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle();

// Pre-select habit_ids from that session's linked logs
```

---

## Camera & Build

- **Library**: `expo-camera` (EAS compatible, no frame processors needed)
- **EAS build required** — Expo Go cannot access camera module
- **Supabase Storage**: private bucket `session-videos`, RLS by user_id
- **Video format**: `.mp4`, stored at `{user_id}/{session_id}/{angle}.mp4`

---

## Files

| File | Change |
|------|--------|
| `src/screens/SessionSetupScreen.js` | New |
| `src/screens/RecordVideoScreen.js` | New |
| `src/screens/VideoPreviewScreen.js` | New |
| `src/screens/LinkSessionScreen.js` | New |
| `src/navigation/AppNavigator.js` | Add RecordStack modal navigator |
| `src/screens/HomeScreen.js` | Wire "Record Set" + draft banner |
| `app.config.js` | Add expo-camera plugin |
| `supabase-schema.sql` | Add gym_sessions + session_videos tables |
| `eas.json` | New — EAS build config |

---

## Out of Scope (Phase 4)
- AI pose estimation / form scoring
- react-native-vision-camera frame processors
- Video playback history / category-level aggregation view
