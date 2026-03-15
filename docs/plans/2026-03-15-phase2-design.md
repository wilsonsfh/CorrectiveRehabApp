# Phase 2 — Gym-Specific Habit Tracker Design

## Summary
Add daily off-gym habit awareness driven by the user's gym session logs.
No new core UX screens — extend existing Log tab with a sub-tab switcher.
Smart push notifications fire on non-gym days, pre-fill the daily log form on tap.

---

## Core Flow

1. User logs gym asymmetry (e.g. `ankle_cave`) in GYM SESSION tab
2. App detects no workout logged today → fires contextual notification
3. Notification: "You logged Ankle Cave last session — watch for: flat shoes, cross-legged sitting"
4. User taps → Log tab opens → DAILY HABITS sub-tab → related habits pre-selected
5. User adjusts chips if needed → Save → stored as `habit_logs` with `context = 'daily'`

---

## Data Model

### DB changes (Supabase Dashboard SQL)
```sql
ALTER TABLE habit_logs ADD COLUMN context TEXT DEFAULT 'gym' CHECK (context IN ('gym', 'daily'));
ALTER TABLE habit_logs ADD COLUMN duration_minutes INT;
```

### New static data: `DAILY_HABITS` in mockData.js

Each daily habit has `regions[]` matching the gym habit regions system.
Gym → off-gym relationships are inferred by region intersection (no explicit cross-references).

```js
export const DAILY_HABITS = [
  // Hip region
  { id: 'cross_legged_sit',    label: 'Sat cross-legged',               regions: ['hip', 'knee'] },
  { id: 'wallet_back_pocket',  label: 'Wallet in back pocket',          regions: ['hip'] },
  { id: 'uneven_stance',       label: 'Stood with weight shifted',      regions: ['hip', 'ankle'] },
  { id: 'bag_one_shoulder',    label: 'Bag on one shoulder',            regions: ['hip', 'shoulder'] },
  // Ankle / Knee region
  { id: 'unsupportive_shoes',  label: 'Wore flat/unsupportive shoes',   regions: ['ankle', 'knee'] },
  { id: 'prolonged_standing',  label: 'Prolonged standing on hard floor', regions: ['ankle'] },
  // Shoulder region
  { id: 'phone_neck',          label: 'Phone neck (looking down)',      regions: ['shoulder', 'spine'] },
  { id: 'desk_hunch',          label: 'Hunched at desk',                regions: ['shoulder', 'spine'] },
  // Spine region
  { id: 'rounded_back_driving',label: 'Rounded back while driving',     regions: ['spine', 'hip'] },
  { id: 'deep_couch_sit',      label: 'Slouched in deep/low couch',     regions: ['spine', 'hip'] },
];
```

### Updated `GYM_HABITS` regions
```js
{ id: 'hip_shift',       regions: ['hip', 'ankle'] }
{ id: 'ankle_cave',      regions: ['ankle', 'knee', 'hip'] }
{ id: 'hip_hike',        regions: ['hip', 'knee'] }
{ id: 'shoulder_shrug',  regions: ['shoulder', 'spine'] }
{ id: 'forward_lean',    regions: ['spine', 'hip'] }
{ id: 'butt_wink',       regions: ['spine', 'hip'] }
```

### Relationship inference
```js
function getRelatedDailyHabits(gymHabitId) {
  const gymHabit = GYM_HABITS.find(h => h.id === gymHabitId);
  return DAILY_HABITS.filter(d =>
    d.regions.some(r => gymHabit.regions.includes(r))
  );
}
```

---

## UI Changes

### Log tab — pill switcher
```
┌─────────────────────────────────┐
│  [ GYM SESSION ] [ DAILY HABITS ]│  ← pill switcher at top
└─────────────────────────────────┘
```
- GYM SESSION: existing form unchanged
- DAILY HABITS: simplified form
  - Habit chips (pre-selected if opened from notification)
  - Context dropdown: At desk / Commuting / At home / Other
  - Duration in minutes (optional)
  - Notes (optional)
  - Save button

### HomeScreen — no changes (Latest Alert already shows gym context)

### Notification deep-link
- URL: `correctiverehab://log?tab=daily&habits=ankle_cave`
- App opens Log tab, switches to DAILY HABITS sub-tab, pre-selects related habits

---

## Push Notifications

### Library: `expo-notifications`

### Schedule logic
- On app foreground: check if any `workout_sessions` logged today
- If **no gym session today**: schedule 2 local notifications
  - 10:00am: morning reminder
  - 3:00pm: afternoon reminder
- Content derived from user's **most recent 3 gym habit logs** (distinct `habit_id`)
- Cancel pending notifications on days where gym session IS logged

### Notification content example
```
Title: "Posture Check"
Body:  "You've been logging Ankle Cave — watch for flat shoes & uneven standing today"
Data:  { tab: 'daily', habits: ['ankle_cave'] }
```

### Permissions
- Request on first login (after auth, before HomeScreen renders)
- Store permission status, don't re-request if denied

---

## Files Changed

| File | Change |
|------|--------|
| `src/data/mockData.js` | Add `DAILY_HABITS`, add `regions[]` to `GYM_HABITS` |
| `src/screens/LogScreen.js` | Add GYM/DAILY pill switcher, daily habits form |
| `src/screens/HomeScreen.js` | Schedule notifications on focus (useFocusEffect) |
| `src/lib/notifications.js` | New — notification scheduling + permission logic |
| `App.js` | Handle notification deep-link on app open |
| `supabase-schema.sql` | Add ALTER TABLE statements |

---

## Out of Scope (Phase 2)
- Correlation analytics (Phase 5)
- User-configurable notification times (future)
- Badge counts on app icon
