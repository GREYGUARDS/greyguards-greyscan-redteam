
-- 1. Remove permissive non-admin INSERT policy on user_brand_access
DROP POLICY IF EXISTS "Users can add access to brands they own" ON public.user_brand_access;

-- 2. Tighten platform_access_requests INSERT policy:
--    If authenticated, the email must match the authenticated user's email.
--    Anonymous submissions are allowed but cannot set privileged fields.
DROP POLICY IF EXISTS "Anyone can submit access requests" ON public.platform_access_requests;
DROP POLICY IF EXISTS "Anyone can request access" ON public.platform_access_requests;
DROP POLICY IF EXISTS "platform_access_requests_insert" ON public.platform_access_requests;

CREATE POLICY "Submit access request (no impersonation)"
ON public.platform_access_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'pending'
  AND approved_by IS NULL
  AND approved_at IS NULL
  AND decision_notes IS NULL
  AND (
    auth.uid() IS NULL
    OR lower(email) = lower((SELECT u.email FROM auth.users u WHERE u.id = auth.uid()))
  )
);

-- Allow authenticated users to view their own requests by email match
DROP POLICY IF EXISTS "Users can view own requests" ON public.platform_access_requests;
CREATE POLICY "Users can view own requests"
ON public.platform_access_requests
FOR SELECT
TO authenticated
USING (
  lower(email) = lower((SELECT u.email FROM auth.users u WHERE u.id = auth.uid()))
);

-- 3. Harden user_can_access_realtime_topic: deny-by-default for unknown patterns
CREATE OR REPLACE FUNCTION public.user_can_access_realtime_topic(_topic text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _uuid_matches text[];
  _sid uuid;
  _u text;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  IF _topic IS NULL THEN RETURN false; END IF;

  -- Only allow topics that follow our known prefixes:
  --   session:<uuid>, injects:<uuid>, teams:<uuid>
  IF _topic !~ '^(session|injects|teams):[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
    RETURN false;
  END IF;

  _u := substring(_topic from '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}');
  BEGIN _sid := _u::uuid; EXCEPTION WHEN others THEN RETURN false; END;
  RETURN public.is_session_participant(_sid, auth.uid());
END $function$;

-- 4. Lock down SECURITY DEFINER function execution:
--    revoke from PUBLIC + anon for everything; grant only to roles that need it.
REVOKE EXECUTE ON FUNCTION public.is_session_participant(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.lookup_session_by_code(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.user_can_access_realtime_topic(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.list_session_team_slots(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.join_exercise_team(uuid, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_my_locked_brand() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_approve_access_request(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_reject_access_request(uuid, text) FROM PUBLIC, anon;

-- Trigger-only functions: revoke from everyone except service_role/postgres
REVOKE EXECUTE ON FUNCTION public.set_exercise_session_owner() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_exercise_team_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_request_brand_verification() FROM PUBLIC, anon, authenticated;

-- Grant execute only to authenticated for the client-callable functions
GRANT EXECUTE ON FUNCTION public.lookup_session_by_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_session_team_slots(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_exercise_team(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_locked_brand() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_approve_access_request(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reject_access_request(uuid, text) TO authenticated;
-- is_session_participant is used by RLS policies; authenticated needs execute to evaluate own queries
GRANT EXECUTE ON FUNCTION public.is_session_participant(uuid, uuid) TO authenticated;
