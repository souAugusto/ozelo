-- Web Push subscriptions, reminder preferences, and a dedup log so the
-- scheduled sender never fires the same reminder twice in one day.

alter table public.profiles
  add column if not exists notification_permission text not null default 'not_requested'
    check (notification_permission in ('not_requested', 'granted', 'denied')),
  add column if not exists water_reminder_enabled boolean not null default true,
  add column if not exists water_reminder_check_time time not null default '18:00',
  add column if not exists diary_reminder_enabled boolean not null default true,
  add column if not exists diary_reminder_time time not null default '20:00';

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions owner access" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- One row per (user, reminder type, date) — the sender inserts before
-- sending and skips if the insert conflicts, so a reminder only ever goes
-- out once per day even if the cron tick overlaps a reminder's minute twice.
create table if not exists public.reminder_sends (
  user_id uuid not null references public.profiles (id) on delete cascade,
  reminder_type text not null check (reminder_type in ('medication', 'hydration', 'diary')),
  sent_date date not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, reminder_type, sent_date)
);

alter table public.reminder_sends enable row level security;
-- No policies: only the service-role edge function ever touches this table.
