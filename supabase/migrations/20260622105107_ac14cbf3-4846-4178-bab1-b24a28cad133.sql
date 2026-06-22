
CREATE OR REPLACE FUNCTION public.list_session_team_slots(_session_id uuid)
RETURNS TABLE (team_type text, team_name text, is_connected boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.team_type, t.team_name, COALESCE(t.is_connected, false) AS is_connected
  FROM public.exercise_teams t
  JOIN public.exercise_sessions s ON s.id = t.session_id
  WHERE t.session_id = _session_id
    AND s.status IN ('waiting','active')
    AND s.created_at > now() - interval '24 hours';
$$;
GRANT EXECUTE ON FUNCTION public.list_session_team_slots(uuid) TO authenticated;
