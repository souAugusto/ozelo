-- Medication application scheduling: recurrence (weekly on a given weekday,
-- or every N days) plus the precomputed absolute next-due timestamp that
-- both the dashboard and the send-reminders edge function read directly,
-- instead of each recomputing "is today the right day" independently.
alter table public.profiles
  add column if not exists medication_frequency_type text
    check (medication_frequency_type in ('weekly', 'interval_days')),
  add column if not exists medication_weekday smallint
    check (medication_weekday between 0 and 6),
  add column if not exists medication_interval_days smallint
    check (medication_interval_days > 0),
  add column if not exists next_medication_at timestamptz;
