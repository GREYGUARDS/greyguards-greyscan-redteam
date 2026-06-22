
-- exercise_sessions
DROP POLICY IF EXISTS "Anyone can create sessions" ON public.exercise_sessions;
DROP POLICY IF EXISTS "Update recent active sessions only" ON public.exercise_sessions;
DROP POLICY IF EXISTS "View sessions by code or recent active" ON public.exercise_sessions;

CREATE POLICY "Authenticated users can create sessions"
ON public.exercise_sessions FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update recent active sessions"
ON public.exercise_sessions FOR UPDATE TO authenticated
USING ((status = ANY (ARRAY['waiting'::text, 'active'::text])) AND (created_at > (now() - interval '24 hours')));

CREATE POLICY "Authenticated users can view recent sessions"
ON public.exercise_sessions FOR SELECT TO authenticated
USING (
  ((status = ANY (ARRAY['waiting'::text, 'active'::text])) AND (created_at > (now() - interval '24 hours')))
  OR ((status = 'completed'::text) AND (completed_at > (now() - interval '2 hours')))
);

-- exercise_teams
DROP POLICY IF EXISTS "Join recent sessions" ON public.exercise_teams;
DROP POLICY IF EXISTS "Update teams in active sessions" ON public.exercise_teams;
DROP POLICY IF EXISTS "View teams in recent sessions" ON public.exercise_teams;

CREATE POLICY "Authenticated users can join recent sessions"
ON public.exercise_teams FOR INSERT TO authenticated
WITH CHECK (session_id IN (
  SELECT id FROM public.exercise_sessions
  WHERE status = ANY (ARRAY['waiting'::text, 'active'::text])
    AND created_at > (now() - interval '24 hours')
));

CREATE POLICY "Authenticated users can update teams in active sessions"
ON public.exercise_teams FOR UPDATE TO authenticated
USING (session_id IN (
  SELECT id FROM public.exercise_sessions
  WHERE status = ANY (ARRAY['waiting'::text, 'active'::text])
    AND created_at > (now() - interval '24 hours')
));

CREATE POLICY "Authenticated users can view teams in recent sessions"
ON public.exercise_teams FOR SELECT TO authenticated
USING (session_id IN (
  SELECT id FROM public.exercise_sessions
  WHERE ((status = ANY (ARRAY['waiting'::text, 'active'::text])) AND (created_at > (now() - interval '24 hours')))
     OR ((status = 'completed'::text) AND (completed_at > (now() - interval '2 hours')))
));

-- exercise_injects
DROP POLICY IF EXISTS "Create injects in active sessions" ON public.exercise_injects;
DROP POLICY IF EXISTS "Update injects in active sessions" ON public.exercise_injects;
DROP POLICY IF EXISTS "View injects in recent sessions" ON public.exercise_injects;

CREATE POLICY "Authenticated users can create injects in active sessions"
ON public.exercise_injects FOR INSERT TO authenticated
WITH CHECK (session_id IN (
  SELECT id FROM public.exercise_sessions
  WHERE status = ANY (ARRAY['waiting'::text, 'active'::text])
    AND created_at > (now() - interval '24 hours')
));

CREATE POLICY "Authenticated users can update injects in active sessions"
ON public.exercise_injects FOR UPDATE TO authenticated
USING (session_id IN (
  SELECT id FROM public.exercise_sessions
  WHERE status = ANY (ARRAY['waiting'::text, 'active'::text])
    AND created_at > (now() - interval '24 hours')
));

CREATE POLICY "Authenticated users can view injects in recent sessions"
ON public.exercise_injects FOR SELECT TO authenticated
USING (session_id IN (
  SELECT id FROM public.exercise_sessions
  WHERE ((status = ANY (ARRAY['waiting'::text, 'active'::text])) AND (created_at > (now() - interval '24 hours')))
     OR ((status = 'completed'::text) AND (completed_at > (now() - interval '2 hours')))
));

-- exercise_responses
DROP POLICY IF EXISTS "Create responses in active sessions" ON public.exercise_responses;
DROP POLICY IF EXISTS "View responses in recent sessions" ON public.exercise_responses;

CREATE POLICY "Authenticated users can submit responses in active sessions"
ON public.exercise_responses FOR INSERT TO authenticated
WITH CHECK (session_id IN (
  SELECT id FROM public.exercise_sessions
  WHERE status = ANY (ARRAY['waiting'::text, 'active'::text])
    AND created_at > (now() - interval '24 hours')
));

CREATE POLICY "Authenticated users can view responses in recent sessions"
ON public.exercise_responses FOR SELECT TO authenticated
USING (session_id IN (
  SELECT id FROM public.exercise_sessions
  WHERE ((status = ANY (ARRAY['waiting'::text, 'active'::text])) AND (created_at > (now() - interval '24 hours')))
     OR ((status = 'completed'::text) AND (completed_at > (now() - interval '2 hours')))
));
