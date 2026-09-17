-- Adds updated_at (kept fresh by the existing set_updated_at trigger function)
-- to the tables that now support editing: meals, bowel_logs, symptom_logs.
alter table public.meals add column if not exists updated_at timestamptz not null default now();
alter table public.bowel_logs add column if not exists updated_at timestamptz not null default now();
alter table public.symptom_logs add column if not exists updated_at timestamptz not null default now();

drop trigger if exists set_meals_updated_at on public.meals;
create trigger set_meals_updated_at
  before update on public.meals
  for each row execute function public.set_updated_at();

drop trigger if exists set_bowel_logs_updated_at on public.bowel_logs;
create trigger set_bowel_logs_updated_at
  before update on public.bowel_logs
  for each row execute function public.set_updated_at();

drop trigger if exists set_symptom_logs_updated_at on public.symptom_logs;
create trigger set_symptom_logs_updated_at
  before update on public.symptom_logs
  for each row execute function public.set_updated_at();
