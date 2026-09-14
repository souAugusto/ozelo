-- The signup flow can no longer assume a session exists right after
-- auth.signUp() (Supabase requires email confirmation before a session is
-- issued). Onboarding answers are now passed as user metadata at signUp
-- time — which is always saved immediately, regardless of confirmation
-- status — and this trigger persists them into profiles/symptom_logs as
-- soon as the auth.users row is created.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  symptom_value text;
begin
  insert into public.profiles (
    id,
    full_name,
    medication,
    current_weight_kg,
    goal_weight_kg,
    onboarding_completed_at
  )
  values (
    new.id,
    meta ->> 'full_name',
    nullif(meta ->> 'medication', ''),
    nullif(meta ->> 'current_weight_kg', '')::numeric,
    nullif(meta ->> 'goal_weight_kg', '')::numeric,
    now()
  );

  if jsonb_typeof(meta -> 'symptoms') = 'array' then
    for symptom_value in select jsonb_array_elements_text(meta -> 'symptoms')
    loop
      insert into public.symptom_logs (user_id, symptom, intensity)
      values (new.id, symptom_value, 'mild');
    end loop;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;
