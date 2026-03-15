-- CorrectiveRehabApp — Phase 1 Schema
-- Run this in your Supabase Dashboard → SQL Editor

-- ─── HABIT LOGS ───
create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null default current_date,
  habit_id text not null,
  habit_label text not null,
  sets int,
  feeling text,
  exercise text,
  severity text check (severity in ('mild', 'moderate', 'severe')) default 'moderate',
  created_at timestamptz default now()
);

-- ─── WORKOUT SESSIONS ───
create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  exercise_id text not null,
  completed_at timestamptz default now(),
  duration_seconds int,
  notes text
);

-- ─── ROW LEVEL SECURITY ───

alter table public.habit_logs enable row level security;
alter table public.workout_sessions enable row level security;

-- habit_logs: users can only CRUD their own rows
create policy "Users can view own habit_logs"
  on public.habit_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own habit_logs"
  on public.habit_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own habit_logs"
  on public.habit_logs for update
  using (auth.uid() = user_id);

create policy "Users can delete own habit_logs"
  on public.habit_logs for delete
  using (auth.uid() = user_id);

-- workout_sessions: users can only CRUD their own rows
create policy "Users can view own workout_sessions"
  on public.workout_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own workout_sessions"
  on public.workout_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own workout_sessions"
  on public.workout_sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete own workout_sessions"
  on public.workout_sessions for delete
  using (auth.uid() = user_id);

-- ─── PHASE 2 ADDITIONS ───
-- Run these if you already ran the Phase 1 schema above

alter table public.habit_logs
  add column if not exists context text default 'gym'
    check (context in ('gym', 'daily'));

alter table public.habit_logs
  add column if not exists duration_minutes int;

-- ─── INDEXES ───
create index idx_habit_logs_user_date on public.habit_logs(user_id, date desc);
create index idx_workout_sessions_user on public.workout_sessions(user_id, completed_at desc);
