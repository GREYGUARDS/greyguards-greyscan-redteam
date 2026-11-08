CREATE TABLE public.host_session_preparations (session_id uuid PRIMARY KEY REFERENCES public.exercise_sessions(id) ON DELETE CASCADE, host_notes text NOT NULL DEFAULT '');
GRANT SELECT,INSERT,UPDATE,DELETE ON public.host_session_preparations TO authenticated;
GRANT ALL ON public.host_session_preparations TO service_role;
ALTER TABLE public.host_session_preparations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authorised owner manages private preparations" ON public.host_session_preparations FOR ALL TO authenticated USING (public.is_session_host(session_id,auth.uid()) AND public.is_admin(auth.uid())) WITH CHECK (public.is_session_host(session_id,auth.uid()) AND public.is_admin(auth.uid()));
COMMENT ON COLUMN public.exercise_sessions.preparation_notes IS 'DEPRECATED: replaced by private host_session_preparations.host_notes; never store host notes on participant-readable sessions';
CREATE OR REPLACE FUNCTION public.join_exercise_team(_session_id uuid, _team_type text, _team_name text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _uid uuid:=auth.uid(); _team_id uuid;
BEGIN
IF _uid IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
IF _team_type NOT IN ('blue','red','observer') THEN RAISE EXCEPTION 'invalid team type'; END IF;
IF NOT EXISTS (SELECT 1 FROM public.exercise_sessions WHERE id=_session_id AND status IN ('waiting','active','paused') AND coalesce(opened_at,started_at,created_at)>now()-interval '24 hours') THEN RAISE EXCEPTION 'session not joinable'; END IF;
IF _team_type='observer' THEN SELECT id INTO _team_id FROM public.exercise_teams WHERE session_id=_session_id AND team_type='observer' AND user_id=_uid LIMIT 1;
ELSE SELECT id INTO _team_id FROM public.exercise_teams WHERE session_id=_session_id AND team_type=_team_type LIMIT 1; END IF;
IF _team_id IS NULL THEN INSERT INTO public.exercise_teams(session_id,team_type,team_name,is_connected,user_id) VALUES (_session_id,_team_type,_team_name,true,_uid) RETURNING id INTO _team_id;
ELSE UPDATE public.exercise_teams SET is_connected=true,team_name=_team_name,user_id=_uid WHERE id=_team_id; END IF;
RETURN _team_id;
END $$;