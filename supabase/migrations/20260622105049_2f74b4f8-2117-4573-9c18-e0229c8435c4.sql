
-- 1. Add ownership columns
ALTER TABLE public.exercise_sessions ADD COLUMN IF NOT EXISTS created_by_user_id uuid;
ALTER TABLE public.exercise_teams    ADD COLUMN IF NOT EXISTS user_id uuid;

-- 2. Auto-populate on insert
CREATE OR REPLACE FUNCTION public.set_exercise_session_owner()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.created_by_user_id IS NULL THEN
    NEW.created_by_user_id := auth.uid();
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS exercise_sessions_set_owner ON public.exercise_sessions;
CREATE TRIGGER exercise_sessions_set_owner
BEFORE INSERT ON public.exercise_sessions
FOR EACH ROW EXECUTE FUNCTION public.set_exercise_session_owner();

CREATE OR REPLACE FUNCTION public.set_exercise_team_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS exercise_teams_set_user ON public.exercise_teams;
CREATE TRIGGER exercise_teams_set_user
BEFORE INSERT ON public.exercise_teams
FOR EACH ROW EXECUTE FUNCTION public.set_exercise_team_user();

-- 3. Helper: is user a participant in this session?
CREATE OR REPLACE FUNCTION public.is_session_participant(_session_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.exercise_sessions s
    WHERE s.id = _session_id AND s.created_by_user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.exercise_teams t
    WHERE t.session_id = _session_id AND t.user_id = _user_id
  );
$$;

-- 4. Replace SELECT/UPDATE policies on exercise_sessions
DROP POLICY IF EXISTS "Authenticated users can view recent sessions" ON public.exercise_sessions;
DROP POLICY IF EXISTS "Authenticated users can update recent active sessions" ON public.exercise_sessions;
DROP POLICY IF EXISTS "Authenticated users can create sessions" ON public.exercise_sessions;

CREATE POLICY "Participants can view their sessions"
ON public.exercise_sessions FOR SELECT TO authenticated
USING (public.is_session_participant(id, auth.uid()));

CREATE POLICY "Owners can update their sessions"
ON public.exercise_sessions FOR UPDATE TO authenticated
USING (created_by_user_id = auth.uid());

CREATE POLICY "Authenticated users can create their own sessions"
ON public.exercise_sessions FOR INSERT TO authenticated
WITH CHECK (created_by_user_id = auth.uid() OR created_by_user_id IS NULL);

-- 5. Replace policies on exercise_teams
DROP POLICY IF EXISTS "Authenticated users can view teams in recent sessions" ON public.exercise_teams;
DROP POLICY IF EXISTS "Authenticated users can update teams in active sessions" ON public.exercise_teams;
DROP POLICY IF EXISTS "Authenticated users can join recent sessions" ON public.exercise_teams;

CREATE POLICY "Participants can view teams"
ON public.exercise_teams FOR SELECT TO authenticated
USING (public.is_session_participant(session_id, auth.uid()));

CREATE POLICY "Participants can update teams in their sessions"
ON public.exercise_teams FOR UPDATE TO authenticated
USING (public.is_session_participant(session_id, auth.uid()));

CREATE POLICY "Session owner can create teams"
ON public.exercise_teams FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.exercise_sessions s WHERE s.id = session_id AND s.created_by_user_id = auth.uid())
);

-- 6. Replace policies on exercise_injects
DROP POLICY IF EXISTS "Authenticated users can view injects in recent sessions" ON public.exercise_injects;
DROP POLICY IF EXISTS "Authenticated users can update injects in active sessions" ON public.exercise_injects;
DROP POLICY IF EXISTS "Authenticated users can create injects in active sessions" ON public.exercise_injects;

CREATE POLICY "Participants can view injects"
ON public.exercise_injects FOR SELECT TO authenticated
USING (public.is_session_participant(session_id, auth.uid()));

CREATE POLICY "Participants can create injects in their sessions"
ON public.exercise_injects FOR INSERT TO authenticated
WITH CHECK (public.is_session_participant(session_id, auth.uid()));

CREATE POLICY "Participants can update injects in their sessions"
ON public.exercise_injects FOR UPDATE TO authenticated
USING (public.is_session_participant(session_id, auth.uid()));

-- 7. Replace policies on exercise_responses
DROP POLICY IF EXISTS "Authenticated users can view responses in recent sessions" ON public.exercise_responses;
DROP POLICY IF EXISTS "Authenticated users can submit responses in active sessions" ON public.exercise_responses;

CREATE POLICY "Participants can view responses"
ON public.exercise_responses FOR SELECT TO authenticated
USING (public.is_session_participant(session_id, auth.uid()));

CREATE POLICY "Participants can submit responses in their sessions"
ON public.exercise_responses FOR INSERT TO authenticated
WITH CHECK (public.is_session_participant(session_id, auth.uid()));

-- 8. RPCs for the join-by-code flow (joiners cannot SELECT a session they don't yet belong to)
CREATE OR REPLACE FUNCTION public.lookup_session_by_code(_code text)
RETURNS TABLE (
  id uuid, session_code text, brand_name text, status text,
  team_mode text, duration int, created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.id, s.session_code, s.brand_name, s.status, s.team_mode, s.duration, s.created_at
  FROM public.exercise_sessions s
  WHERE s.session_code = upper(_code)
    AND s.status IN ('waiting', 'active')
    AND s.created_at > (now() - interval '24 hours')
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.join_exercise_team(
  _session_id uuid, _team_type text, _team_name text
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _team_id uuid;
  _session_ok boolean;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  SELECT EXISTS (
    SELECT 1 FROM public.exercise_sessions
    WHERE id = _session_id
      AND status IN ('waiting','active')
      AND created_at > now() - interval '24 hours'
  ) INTO _session_ok;
  IF NOT _session_ok THEN RAISE EXCEPTION 'session not joinable'; END IF;

  SELECT id INTO _team_id FROM public.exercise_teams
  WHERE session_id = _session_id AND team_type = _team_type LIMIT 1;

  IF _team_id IS NULL THEN
    INSERT INTO public.exercise_teams (session_id, team_type, team_name, is_connected, user_id)
    VALUES (_session_id, _team_type, _team_name, true, _uid)
    RETURNING id INTO _team_id;
  ELSE
    UPDATE public.exercise_teams
       SET is_connected = true, team_name = _team_name, user_id = _uid
     WHERE id = _team_id;
  END IF;
  RETURN _team_id;
END $$;

GRANT EXECUTE ON FUNCTION public.lookup_session_by_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_exercise_team(uuid, text, text) TO authenticated;

-- 9. Realtime topic scoping
DROP POLICY IF EXISTS "Authenticated users can read realtime messages" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated users can send realtime messages" ON realtime.messages;

CREATE OR REPLACE FUNCTION public.user_can_access_realtime_topic(_topic text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uuid_text text;
  _sid uuid;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  _uuid_text := substring(_topic from '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}');
  IF _uuid_text IS NULL THEN
    -- Topic does not contain a session id; allow only if topic doesn't look like a session channel
    RETURN _topic NOT LIKE '%session%' AND _topic NOT LIKE '%injects%' AND _topic NOT LIKE '%teams%';
  END IF;
  BEGIN _sid := _uuid_text::uuid; EXCEPTION WHEN others THEN RETURN false; END;
  RETURN public.is_session_participant(_sid, auth.uid());
END $$;

CREATE POLICY "Topic-scoped realtime read"
ON realtime.messages FOR SELECT TO authenticated
USING (public.user_can_access_realtime_topic(realtime.topic()));

CREATE POLICY "Topic-scoped realtime write"
ON realtime.messages FOR INSERT TO authenticated
WITH CHECK (public.user_can_access_realtime_topic(realtime.topic()));
