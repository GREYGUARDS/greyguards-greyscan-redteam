
-- 1. exercise_sessions: require created_by_user_id = auth.uid()
DROP POLICY IF EXISTS "Authenticated users can create their own sessions" ON public.exercise_sessions;
CREATE POLICY "Authenticated users can create their own sessions"
ON public.exercise_sessions FOR INSERT TO authenticated
WITH CHECK (created_by_user_id = auth.uid());

-- 2. exercise_teams: only the team's own user (or session owner) can update
DROP POLICY IF EXISTS "Participants can update teams in their sessions" ON public.exercise_teams;
CREATE POLICY "Team member or session owner can update team"
ON public.exercise_teams FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.exercise_sessions s WHERE s.id = exercise_teams.session_id AND s.created_by_user_id = auth.uid())
)
WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.exercise_sessions s WHERE s.id = exercise_teams.session_id AND s.created_by_user_id = auth.uid())
);

-- 3. exercise_injects: only session owner can create/update
DROP POLICY IF EXISTS "Participants can create injects in their sessions" ON public.exercise_injects;
DROP POLICY IF EXISTS "Participants can update injects in their sessions" ON public.exercise_injects;
CREATE POLICY "Session owner can create injects"
ON public.exercise_injects FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.exercise_sessions s WHERE s.id = exercise_injects.session_id AND s.created_by_user_id = auth.uid()));
CREATE POLICY "Session owner can update injects"
ON public.exercise_injects FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.exercise_sessions s WHERE s.id = exercise_injects.session_id AND s.created_by_user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.exercise_sessions s WHERE s.id = exercise_injects.session_id AND s.created_by_user_id = auth.uid()));

-- 4. Revoke EXECUTE from authenticated/public/anon on SECURITY DEFINER functions
-- that are only used internally by RLS policies or other definer functions (not called from client).
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_session_participant(uuid, uuid) FROM PUBLIC, anon, authenticated;
