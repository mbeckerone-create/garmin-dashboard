create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.daily_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stat_date date not null,
  steps integer not null default 0,
  step_goal integer not null default 7000,
  total_distance_mi numeric(8, 2) not null default 0,
  active_minutes numeric(6, 1) not null default 0,
  active_calories integer not null default 0,
  floors integer not null default 0,
  resting_hr integer,
  min_hr integer,
  max_hr integer,
  intensity_minutes integer not null default 0,
  moderate_minutes integer not null default 0,
  vigorous_minutes integer not null default 0,
  sleep_minutes integer,
  hrv_ms integer,
  stress_avg integer,
  source text not null default 'garmin',
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, stat_date)
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  garmin_activity_id text,
  activity_date date not null,
  started_at timestamptz not null,
  activity_type text not null,
  title text not null,
  distance_mi numeric(8, 2) not null default 0,
  duration_seconds integer not null default 0,
  avg_pace_sec_per_mi integer,
  avg_hr integer,
  max_hr integer,
  calories integer,
  source_payload jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, garmin_activity_id)
);

create table if not exists public.activity_segments (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  segment_order integer not null,
  segment_type text not null,
  label text not null,
  started_at timestamptz,
  distance_mi numeric(8, 2) not null default 0,
  duration_seconds integer not null default 0,
  avg_pace_sec_per_mi integer,
  avg_hr integer,
  max_hr integer,
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (activity_id, segment_order)
);

alter table public.profiles enable row level security;
alter table public.daily_stats enable row level security;
alter table public.activities enable row level security;
alter table public.activity_segments enable row level security;

create policy "Users can read own profile"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

create policy "Users can update own profile"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Users can read own daily stats"
on public.daily_stats for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read own activities"
on public.activities for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read own activity segments"
on public.activity_segments for select
to authenticated
using ((select auth.uid()) = user_id);

create index if not exists daily_stats_user_date_idx
on public.daily_stats (user_id, stat_date desc);

create index if not exists activities_user_started_idx
on public.activities (user_id, started_at desc);

create index if not exists activity_segments_activity_order_idx
on public.activity_segments (activity_id, segment_order);

create index if not exists activity_segments_user_idx
on public.activity_segments (user_id);
