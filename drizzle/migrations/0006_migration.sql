ALTER TABLE public.exercise_sessions
  ADD COLUMN IF NOT EXISTS pre_brief text,
  ADD COLUMN IF NOT EXISTS freeze_prompt text,
  ADD COLUMN IF NOT EXISTS decision_log jsonb NOT NULL DEFAULT '[]'::jsonb;

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
  IF _team_type NOT IN ('blue','red','observer') THEN RAISE EXCEPTION 'invalid team type'; END IF;
  SELECT EXISTS (
    SELECT 1 FROM public.exercise_sessions
    WHERE id = _session_id
      AND status IN ('waiting','active','paused')
      AND created_at > now() - interval '24 hours'
  ) INTO _session_ok;
  IF NOT _session_ok THEN RAISE EXCEPTION 'session not joinable'; END IF;

  IF _team_type = 'observer' THEN
    SELECT id INTO _team_id FROM public.exercise_teams
    WHERE session_id = _session_id AND team_type = 'observer' AND user_id = _uid LIMIT 1;
  ELSE
    SELECT id INTO _team_id FROM public.exercise_teams
    WHERE session_id = _session_id AND team_type = _team_type LIMIT 1;
  END IF;

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

REVOKE EXECUTE ON FUNCTION public.join_exercise_team(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_exercise_team(uuid, text, text) TO authenticated;

-- Observers are read-only: only blue/red team members may submit responses
DROP POLICY IF EXISTS "Participants can submit responses in their sessions" ON public.exercise_responses;
CREATE POLICY "Participants can submit responses in their sessions"
ON public.exercise_responses FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.exercise_teams t
  WHERE t.session_id = exercise_responses.session_id
    AND t.user_id = auth.uid()
    AND t.team_type IN ('blue','red')
));