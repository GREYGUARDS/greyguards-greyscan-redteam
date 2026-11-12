ALTER TABLE public.exercise_sessions ADD COLUMN IF NOT EXISTS room_audio_enabled boolean NOT NULL DEFAULT false;

CREATE TABLE public.exercise_room_transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.exercise_sessions(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.exercise_teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  transcript text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX exercise_room_transcripts_session_idx ON public.exercise_room_transcripts(session_id, created_at DESC);
GRANT SELECT ON public.exercise_room_transcripts TO authenticated;
GRANT ALL ON public.exercise_room_transcripts TO service_role;
ALTER TABLE public.exercise_room_transcripts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Hosts read room transcripts" ON public.exercise_room_transcripts FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()) AND public.is_session_host(session_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.host_set_room_audio(_session_id uuid, _enabled boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.is_admin(auth.uid()) AND public.is_session_host(_session_id, auth.uid())) THEN
    RAISE EXCEPTION 'Only the host can change room audio';
  END IF;
  UPDATE public.exercise_sessions SET room_audio_enabled = _enabled WHERE id = _session_id;
END $$;
REVOKE ALL ON FUNCTION public.host_set_room_audio(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.host_set_room_audio(uuid, boolean) TO authenticated;