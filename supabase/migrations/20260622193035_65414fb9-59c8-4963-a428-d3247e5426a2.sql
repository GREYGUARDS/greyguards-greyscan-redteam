-- Revoke EXECUTE on SECURITY DEFINER helper functions that should not be callable
-- by signed-in users. These are used internally by RLS policies and triggers only.

-- Internal RLS helpers (called from policies, which run as the table owner)
REVOKE EXECUTE ON FUNCTION public.is_session_participant(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.user_can_access_realtime_topic(text) FROM PUBLIC, anon, authenticated;

-- Trigger functions (only ever invoked by the trigger system)
REVOKE EXECUTE ON FUNCTION public.set_exercise_team_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_exercise_session_owner() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_request_brand_verification() FROM PUBLIC, anon, authenticated;