-- Fixes flagged by the Supabase security advisor after the initial schema:
-- both functions had a mutable search_path, and handle_new_user (SECURITY
-- DEFINER) was callable directly through the PostgREST API even though it's
-- only meant to run via the on_auth_user_created trigger.

alter function public.set_updated_at() set search_path = public;

alter function public.handle_new_user() set search_path = public;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
