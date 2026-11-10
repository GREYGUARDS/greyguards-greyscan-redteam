CREATE OR REPLACE FUNCTION public.host_delete_session(_session_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) OR NOT EXISTS (
    SELECT 1 FROM public.exercise_sessions WHERE id = _session_id AND created_by_user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not authorised to delete this session';
  END IF;
  DELETE FROM public.exercise_video_jobs WHERE session_id = _session_id;
  DELETE FROM public.exercise_photo_jobs WHERE session_id = _session_id;
  DELETE FROM public.exercise_artefact_jobs WHERE session_id = _session_id;
  DELETE FROM public.red_visual_requests WHERE session_id = _session_id;
  DELETE FROM public.host_session_preparations WHERE session_id = _session_id;
  DELETE FROM public.exercise_responses WHERE session_id = _session_id;
  DELETE FROM public.exercise_injects WHERE session_id = _session_id;
  DELETE FROM public.exercise_teams WHERE session_id = _session_id;
  DELETE FROM public.exercise_sessions WHERE id = _session_id;
END $$;
REVOKE EXECUTE ON FUNCTION public.host_delete_session(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.host_delete_session(uuid) TO authenticated;