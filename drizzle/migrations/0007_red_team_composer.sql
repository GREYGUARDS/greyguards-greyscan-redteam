ALTER TABLE public.exercise_injects ADD COLUMN IF NOT EXISTS phase text, ADD COLUMN IF NOT EXISTS queue_position integer;
ALTER TABLE public.exercise_injects DROP CONSTRAINT IF EXISTS exercise_injects_phase_check;
ALTER TABLE public.exercise_injects ADD CONSTRAINT exercise_injects_phase_check CHECK (phase IS NULL OR phase IN ('seed','amplify','escalate','break'));

CREATE OR REPLACE FUNCTION public.is_red_member(_session_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.exercise_teams t WHERE t.session_id = _session_id AND t.user_id = _user_id AND t.team_type = 'red');
$$;
CREATE OR REPLACE FUNCTION public.is_session_host(_session_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.exercise_sessions s WHERE s.id = _session_id AND s.created_by_user_id = _user_id);
$$;
REVOKE EXECUTE ON FUNCTION public.is_red_member(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_session_host(uuid, uuid) FROM anon;

-- Participants only see sent injects; Red also sees its own unsent arsenal.
DROP POLICY IF EXISTS "Participants can view injects" ON public.exercise_injects;
CREATE POLICY "Participants can view injects" ON public.exercise_injects FOR SELECT TO authenticated
USING (
  public.is_session_host(session_id, auth.uid())
  OR (is_sent AND public.is_session_participant(session_id, auth.uid()))
  OR (created_by = 'red_team' AND public.is_red_member(session_id, auth.uid()))
);

-- Red may add text-only injects; media is attached only by the host-reviewed functions.
CREATE POLICY "Red team can create text injects" ON public.exercise_injects FOR INSERT TO authenticated
WITH CHECK (
  created_by = 'red_team' AND video_storage_path IS NULL AND artefact IS NULL
  AND public.is_red_member(session_id, auth.uid())
);

CREATE OR REPLACE FUNCTION public.red_fire_inject(_inject_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.exercise_injects;
BEGIN
  SELECT * INTO r FROM public.exercise_injects WHERE id = _inject_id;
  IF r.id IS NULL OR r.created_by <> 'red_team' OR NOT public.is_red_member(r.session_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.exercise_sessions s WHERE s.id = r.session_id AND s.status = 'active') THEN
    RAISE EXCEPTION 'The exercise is not live';
  END IF;
  UPDATE public.exercise_injects SET is_sent = true, sent_at = now(), queue_position = NULL WHERE id = _inject_id AND NOT is_sent;
END $$;

CREATE OR REPLACE FUNCTION public.red_set_queue(_inject_ids uuid[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE i int;
BEGIN
  FOR i IN 1 .. coalesce(array_length(_inject_ids, 1), 0) LOOP
    UPDATE public.exercise_injects SET queue_position = i
    WHERE id = _inject_ids[i] AND created_by = 'red_team' AND NOT is_sent AND public.is_red_member(session_id, auth.uid());
  END LOOP;
END $$;
REVOKE EXECUTE ON FUNCTION public.red_fire_inject(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.red_set_queue(uuid[]) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.red_fire_inject(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.red_set_queue(uuid[]) TO authenticated;

CREATE TABLE public.red_visual_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.exercise_sessions(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.exercise_teams(id) ON DELETE CASCADE,
  format text NOT NULL CHECK (format IN ('news_clip','short_video','photo')),
  brief text NOT NULL CHECK (char_length(brief) BETWEEN 3 AND 1500),
  claim text NOT NULL DEFAULT '' CHECK (char_length(claim) <= 300),
  reach integer NOT NULL DEFAULT 50000 CHECK (reach >= 0),
  phase text CHECK (phase IS NULL OR phase IN ('seed','amplify','escalate','break')),
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','generating','ready','rejected')),
  inject_id uuid,
  host_note text CHECK (host_note IS NULL OR char_length(host_note) <= 300),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.red_visual_requests TO authenticated;
GRANT ALL ON public.red_visual_requests TO service_role;
ALTER TABLE public.red_visual_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Red and host read visual requests" ON public.red_visual_requests FOR SELECT TO authenticated
USING (public.is_red_member(session_id, auth.uid()) OR public.is_session_host(session_id, auth.uid()));
CREATE POLICY "Red creates visual requests" ON public.red_visual_requests FOR INSERT TO authenticated
WITH CHECK (
  status = 'requested' AND inject_id IS NULL AND host_note IS NULL
  AND public.is_red_member(session_id, auth.uid())
  AND EXISTS (SELECT 1 FROM public.exercise_teams t WHERE t.id = team_id AND t.session_id = red_visual_requests.session_id AND t.user_id = auth.uid() AND t.team_type = 'red')
);
CREATE POLICY "Host updates visual requests" ON public.red_visual_requests FOR UPDATE TO authenticated
USING (public.is_session_host(session_id, auth.uid())) WITH CHECK (public.is_session_host(session_id, auth.uid()));
CREATE INDEX red_visual_requests_session_idx ON public.red_visual_requests(session_id, created_at DESC);
ALTER PUBLICATION supabase_realtime ADD TABLE public.red_visual_requests;