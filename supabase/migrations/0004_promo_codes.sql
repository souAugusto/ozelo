-- Promo codes: grant N days of free access without going through Stripe.
-- Both tables are only ever written by the redeem-promo-code edge function
-- (service role) — no RLS policy grants regular users read or write access,
-- so a code's existence/limits can't be probed from the client.
create table if not exists public.promo_codes (
  code text primary key,
  duration_days int not null,
  max_redemptions int,
  redemption_count int not null default 0,
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.promo_codes enable row level security;

create table if not exists public.promo_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  code text not null references public.promo_codes (code),
  redeemed_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.promo_redemptions enable row level security;

-- A first promo code: 30 days of free access, unlimited redemptions.
insert into public.promo_codes (code, duration_days, max_redemptions)
values ('OZELO30', 30, null)
on conflict (code) do nothing;
