CREATE OR REPLACE FUNCTION public.join_exercise_team(_session_id uuid, _team_type text, _team_name text)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _uid uuid:=auth.uid(); _team_id uuid;
BEGIN
IF _uid IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
IF _team_type NOT IN ('blue','red','observer') THEN RAISE EXCEPTION 'invalid team type'; END IF;
IF _team_type <> 'blue' AND NOT public.is_admin(_uid) THEN RAISE EXCEPTION 'participants may only join the Blue Team'; END IF;
IF NOT EXISTS (SELECT 1 FROM public.exercise_sessions WHERE id=_session_id AND status IN ('waiting','active','paused') AND coalesce(opened_at,started_at,created_at)>now()-interval '24 hours') THEN RAISE EXCEPTION 'session not joinable'; END IF;
IF _team_type='observer' THEN SELECT id INTO _team_id FROM public.exercise_teams WHERE session_id=_session_id AND team_type='observer' AND user_id=_uid LIMIT 1;
ELSE SELECT id INTO _team_id FROM public.exercise_teams WHERE session_id=_session_id AND team_type=_team_type LIMIT 1; END IF;
IF _team_id IS NULL THEN INSERT INTO public.exercise_teams(session_id,team_type,team_name,is_connected,user_id) VALUES (_session_id,_team_type,_team_name,true,_uid) RETURNING id INTO _team_id;
ELSE UPDATE public.exercise_teams SET is_connected=true,team_name=_team_name,user_id=_uid WHERE id=_team_id; END IF;
RETURN _team_id;
END $function$;

CREATE OR REPLACE FUNCTION public.is_session_participant(_session_id uuid, _user_id uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.exercise_sessions s WHERE s.id = _session_id AND s.created_by_user_id = _user_id)
  OR EXISTS (SELECT 1 FROM public.exercise_teams t JOIN public.exercise_sessions s ON s.id = t.session_id
    WHERE t.session_id = _session_id AND t.user_id = _user_id AND s.status <> 'locked');
$function$;

CREATE OR REPLACE FUNCTION public.host_lock_session(_session_id uuid)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
IF NOT EXISTS (SELECT 1 FROM public.exercise_sessions WHERE id=_session_id AND created_by_user_id=auth.uid() AND public.is_admin(auth.uid())) THEN RAISE EXCEPTION 'Only the session host can lock this session'; END IF;
UPDATE public.exercise_sessions SET status='locked', completed_at=coalesce(completed_at, now()), session_code='LK'||upper(substr(md5(random()::text),1,10)) WHERE id=_session_id;
UPDATE public.exercise_teams SET is_connected=false WHERE session_id=_session_id;
END $function$;
REVOKE ALL ON FUNCTION public.host_lock_session(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.host_lock_session(uuid) TO authenticated, service_role;