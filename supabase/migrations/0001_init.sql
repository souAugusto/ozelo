-- Ozelo — initial schema
-- Profiles, subscriptions, and every tracking table (medication, meals, symptoms,
-- bowel habit, body measurements, progress photos), all locked down with RLS
-- so a user can only ever read or write their own rows.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  medication text check (medication in ('ozempic', 'mounjaro', 'wegovy', 'other')),
  medication_dose text,
  reminder_time time,
  current_weight_kg numeric(5, 2),
  goal_weight_kg numeric(5, 2),
  height_cm numeric(5, 2),
  protein_goal_g numeric(5, 1) default 90,
  water_goal_ml numeric(6, 1) default 2000,
  units text not null default 'metric' check (units in ('metric', 'imperial')),
  sensitive_data_private boolean not null default true,
  treatment_started_at date default current_date,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are self-readable" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles are self-insertable" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles are self-updatable" on public.profiles
  for update using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- subscriptions (mirrors Stripe subscription status, written only by the
-- service-role webhook — end users can read their own row but never write it)
-- ---------------------------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  plan text check (plan in ('monthly', 'annual')),
  status text not null default 'incomplete'
    check (status in ('incomplete', 'trialing', 'active', 'past_due', 'canceled', 'unpaid')),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists subscriptions_user_id_key on public.subscriptions (user_id);

alter table public.subscriptions enable row level security;

create policy "subscriptions are self-readable" on public.subscriptions
  for select using (auth.uid() = user_id);
-- No insert/update/delete policy for regular users: only the service role
-- (used by the Stripe webhook edge function) can write to this table.

-- ---------------------------------------------------------------------------
-- medication_logs
-- ---------------------------------------------------------------------------
create table if not exists public.medication_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  medication text not null,
  dose text,
  applied_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.medication_logs enable row level security;

create policy "medication_logs owner access" on public.medication_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- meals (diário alimentar)
-- ---------------------------------------------------------------------------
create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  protein_g numeric(5, 1) not null default 0,
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.meals enable row level security;

create policy "meals owner access" on public.meals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- hydration_logs
-- ---------------------------------------------------------------------------
create table if not exists public.hydration_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount_ml numeric(6, 1) not null,
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.hydration_logs enable row level security;

create policy "hydration_logs owner access" on public.hydration_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- symptom_logs
-- ---------------------------------------------------------------------------
create table if not exists public.symptom_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  symptom text not null check (symptom in ('nausea', 'reflux', 'headache', 'dizziness', 'fatigue', 'difficulty_eating')),
  intensity text not null check (intensity in ('mild', 'moderate', 'severe')),
  logged_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.symptom_logs enable row level security;

create policy "symptom_logs owner access" on public.symptom_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- bowel_logs (controle intestinal)
-- ---------------------------------------------------------------------------
create table if not exists public.bowel_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('normal', 'loose', 'hard', 'discomfort')),
  logged_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.bowel_logs enable row level security;

create policy "bowel_logs owner access" on public.bowel_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- body_measurements (progresso)
-- ---------------------------------------------------------------------------
create table if not exists public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  weight_kg numeric(5, 2),
  waist_cm numeric(5, 2),
  hip_cm numeric(5, 2),
  measured_at date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.body_measurements enable row level security;

create policy "body_measurements owner access" on public.body_measurements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- progress_photos (metadata only — binary files live in the private
-- "progress-photos" storage bucket, one folder per user id)
-- ---------------------------------------------------------------------------
create table if not exists public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null,
  week_number int,
  taken_at date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.progress_photos enable row level security;

create policy "progress_photos owner access" on public.progress_photos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- storage: private bucket for progress photos
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do nothing;

create policy "progress photos are owner-readable"
  on storage.objects for select
  using (bucket_id = 'progress-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "progress photos are owner-writable"
  on storage.objects for insert
  with check (bucket_id = 'progress-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "progress photos are owner-deletable"
  on storage.objects for delete
  using (bucket_id = 'progress-photos' and auth.uid()::text = (storage.foldername(name))[1]);

-- ---------------------------------------------------------------------------
-- keep updated_at fresh
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- auto-create a profile row when a new auth user signs up
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
