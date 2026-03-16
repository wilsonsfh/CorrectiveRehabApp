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

-- ─── PHASE 3 ADDITIONS ───

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

create table public.session_videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  session_id uuid references public.gym_sessions(id) on delete cascade not null,
  category_id text not null,
  angle text not null check (angle in ('side', 'front', 'above')),
  storage_path text not null,
  created_at timestamptz default now()
);

alter table public.gym_sessions enable row level security;
alter table public.session_videos enable row level security;

create policy "Users own gym_sessions" on public.gym_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users own session_videos" on public.session_videos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Storage bucket: create in Supabase Dashboard → Storage → New bucket
-- Name: session-videos, Private: true

-- ─── INDEXES ───
create index idx_habit_logs_user_date on public.habit_logs(user_id, date desc);
create index idx_workout_sessions_user on public.workout_sessions(user_id, completed_at desc);

-- ─── PHASE 4a ADDITIONS ───

create table public.analysis_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  session_id uuid references public.gym_sessions(id) on delete cascade not null,
  video_id uuid references public.session_videos(id) on delete cascade,
  angle text not null check (angle in ('side', 'front', 'above')),
  symmetry_score int not null check (symmetry_score between 0 and 100),
  issues jsonb not null default '[]',
  keypoints jsonb,
  processed_at timestamptz default now()
);

alter table public.analysis_results enable row level security; -- so users can only access their own data

create policy "Users own analysis_results" on public.analysis_results
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index idx_analysis_results_session on public.analysis_results(session_id);
create index idx_analysis_results_user on public.analysis_results(user_id, processed_at desc);

-- Add analysis_status to gym_sessions
alter table public.gym_sessions
  add column if not exists analysis_status text default 'pending'
    check (analysis_status in ('pending', 'analyzing', 'complete', 'failed'));
