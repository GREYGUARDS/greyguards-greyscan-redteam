CREATE OR REPLACE FUNCTION public.join_exercise_team(_session_id uuid, _team_type text, _team_name text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _uid uuid:=auth.uid(); _team_id uuid; _occupant uuid;
BEGIN
IF _uid IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
IF _team_type NOT IN ('blue','red','observer') THEN RAISE EXCEPTION 'invalid team type'; END IF;
IF _team_type <> 'blue' AND NOT public.is_admin(_uid) THEN RAISE EXCEPTION 'participants may only join the Blue Team'; END IF;
PERFORM 1 FROM public.exercise_sessions WHERE id=_session_id AND status IN ('waiting','active','paused') AND coalesce(opened_at,started_at,created_at)>now()-interval '24 hours' FOR UPDATE;
IF NOT FOUND THEN RAISE EXCEPTION 'session not joinable'; END IF;
IF _team_type='observer' THEN SELECT id,user_id INTO _team_id,_occupant FROM public.exercise_teams WHERE session_id=_session_id AND team_type='observer' AND user_id=_uid LIMIT 1;
ELSE SELECT id,user_id INTO _team_id,_occupant FROM public.exercise_teams WHERE session_id=_session_id AND team_type=_team_type LIMIT 1; END IF;
IF _team_id IS NOT NULL AND _occupant IS NOT NULL AND _occupant <> _uid THEN RAISE EXCEPTION 'This team already has a participant'; END IF;
IF _team_id IS NULL THEN INSERT INTO public.exercise_teams(session_id,team_type,team_name,is_connected,user_id) VALUES (_session_id,_team_type,left(_team_name,100),true,_uid) RETURNING id INTO _team_id;
ELSE UPDATE public.exercise_teams SET is_connected=true,team_name=left(_team_name,100),user_id=_uid WHERE id=_team_id; END IF;
RETURN _team_id;
END $$;
REVOKE ALL ON FUNCTION public.join_exercise_team(uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.join_exercise_team(uuid,text,text) TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.guard_participant_team_identity() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
IF auth.uid() IS NOT NULL AND NOT public.is_session_host(OLD.session_id,auth.uid()) AND (NEW.id IS DISTINCT FROM OLD.id OR NEW.session_id IS DISTINCT FROM OLD.session_id OR NEW.team_type IS DISTINCT FROM OLD.team_type OR NEW.user_id IS DISTINCT FROM OLD.user_id) THEN RAISE EXCEPTION 'Participants cannot change team identity'; END IF;
RETURN NEW;
END $$;
CREATE TRIGGER guard_participant_team_identity BEFORE UPDATE ON public.exercise_teams FOR EACH ROW EXECUTE FUNCTION public.guard_participant_team_identity();
ALTER POLICY "Participants can submit responses in their sessions" ON public.exercise_responses WITH CHECK (public.is_session_participant(session_id,auth.uid()) AND EXISTS (SELECT 1 FROM public.exercise_teams t WHERE t.id=exercise_responses.team_id AND t.session_id=exercise_responses.session_id AND t.user_id=auth.uid() AND t.team_type='blue') AND EXISTS (SELECT 1 FROM public.exercise_injects i WHERE i.id=exercise_responses.inject_id AND i.session_id=exercise_responses.session_id AND i.is_sent));