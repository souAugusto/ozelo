-- Schedules the send-reminders edge function to run every 15 minutes via
-- pg_cron + pg_net. The function checks the x-cron-secret header itself
-- (it's deployed with verify_jwt disabled, since pg_net calls carry no
-- Supabase user session) — Postgres has no access to edge function secrets,
-- so the shared secret is inlined here instead.
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- cron.schedule() upserts by job name, so re-running this migration (or a
-- future one that needs to tweak the schedule) is safe to repeat.
select cron.schedule(
  'ozelo-send-reminders',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'https://cekaymyeyuxnxdktvwfo.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', '362204c0c753d9ca9878a0609c5103ce8782f57f48fcdf85'
    ),
    body := '{}'::jsonb
  );
  $$
);
