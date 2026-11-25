ALTER TABLE public.exercise_sessions ADD COLUMN forward_read_agreed_by uuid, ADD COLUMN forward_read_agreed_at timestamptz, ADD COLUMN forward_read_version uuid NOT NULL DEFAULT gen_random_uuid(), ADD COLUMN forward_read_paused_at timestamptz;
CREATE TABLE public.forward_read_agreements (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), session_id uuid NOT NULL REFERENCES public.exercise_sessions(id) ON DELETE CASCADE, agreed_by uuid NOT NULL, agreed_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.forward_read_agreements TO authenticated;
GRANT ALL ON public.forward_read_agreements TO service_role;
ALTER TABLE public.forward_read_agreements ENABLE ROW LEVEL SECURITY;
CREATE POLICY host_read_agreements ON public.forward_read_agreements FOR SELECT TO authenticated USING (public.is_admin(auth.uid()) AND public.is_session_host(session_id,auth.uid()));
COMMENT ON TABLE public.exercise_room_transcripts IS 'DEPRECATED: Forward Read never stores room audio or text';
REVOKE ALL ON public.exercise_room_transcripts FROM anon, authenticated, service_role;
CREATE OR REPLACE FUNCTION public.reject_room_transcript() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN RAISE EXCEPTION 'Forward Read does not store transcripts'; END $$;
CREATE TRIGGER reject_room_transcript BEFORE INSERT OR UPDATE ON public.exercise_room_transcripts FOR EACH ROW EXECUTE FUNCTION public.reject_room_transcript();
CREATE OR REPLACE FUNCTION public.guard_forward_read() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF TG_OP='INSERT' THEN
  NEW.room_audio_enabled := false; NEW.forward_read_agreed_by := NULL; NEW.forward_read_agreed_at := NULL;
 ELSE
  IF (NEW.room_audio_enabled IS DISTINCT FROM OLD.room_audio_enabled OR NEW.forward_read_agreed_by IS DISTINCT FROM OLD.forward_read_agreed_by OR NEW.forward_read_agreed_at IS DISTINCT FROM OLD.forward_read_agreed_at OR NEW.forward_read_version IS DISTINCT FROM OLD.forward_read_version) AND coalesce(current_setting('app.forward_read_mutation',true),'') <> 'on' THEN RAISE EXCEPTION 'Use Forward Read agreement controls'; END IF;
  IF NEW.status='paused' AND OLD.status<>'paused' THEN NEW.forward_read_paused_at := now(); END IF;
  IF NEW.status NOT IN ('active','paused') OR (NEW.status='active' AND OLD.status='paused' AND OLD.forward_read_paused_at < now()-interval '30 minutes') THEN NEW.room_audio_enabled := false; NEW.forward_read_version := gen_random_uuid(); END IF;
  IF NEW.status<>'paused' THEN NEW.forward_read_paused_at := NULL; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_forward_read BEFORE INSERT OR UPDATE ON public.exercise_sessions FOR EACH ROW EXECUTE FUNCTION public.guard_forward_read();
CREATE OR REPLACE FUNCTION public.host_set_room_audio(_session_id uuid,_enabled boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NOT(public.is_admin(auth.uid()) AND public.is_session_host(_session_id,auth.uid())) THEN RAISE EXCEPTION 'Only the host can change Forward Read'; END IF;
 IF _enabled THEN RAISE EXCEPTION 'Confirm whole-room agreement to enable Forward Read'; END IF;
 PERFORM set_config('app.forward_read_mutation','on',true);
 UPDATE public.exercise_sessions SET room_audio_enabled=false,forward_read_version=gen_random_uuid() WHERE id=_session_id;
END $$;
CREATE OR REPLACE FUNCTION public.host_enable_forward_read(_session_id uuid,_room_agreed boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF _room_agreed IS DISTINCT FROM true THEN RAISE EXCEPTION 'Whole-room agreement is required'; END IF;
 IF NOT(public.is_admin(auth.uid()) AND public.is_session_host(_session_id,auth.uid())) THEN RAISE EXCEPTION 'Only the host can enable Forward Read'; END IF;
 PERFORM 1 FROM public.exercise_sessions WHERE id=_session_id AND status IN ('active','paused') AND (status<>'paused' OR forward_read_paused_at>now()-interval '30 minutes') FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Start or resume the session first'; END IF;
 PERFORM set_config('app.forward_read_mutation','on',true);
 INSERT INTO public.forward_read_agreements(session_id,agreed_by) VALUES(_session_id,auth.uid());
 UPDATE public.exercise_sessions SET room_audio_enabled=true,forward_read_agreed_by=auth.uid(),forward_read_agreed_at=now(),forward_read_version=gen_random_uuid() WHERE id=_session_id;
END $$;
CREATE OR REPLACE FUNCTION public.blue_disable_forward_read(_session_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NOT(public.is_session_participant(_session_id,auth.uid()) AND EXISTS(SELECT 1 FROM public.exercise_teams WHERE session_id=_session_id AND user_id=auth.uid() AND team_type='blue')) THEN RAISE EXCEPTION 'Only the Blue driver can switch off Forward Read'; END IF;
 PERFORM set_config('app.forward_read_mutation','on',true);
 UPDATE public.exercise_sessions SET room_audio_enabled=false,forward_read_version=gen_random_uuid() WHERE id=_session_id;
END $$;
REVOKE ALL ON FUNCTION public.host_enable_forward_read(uuid,boolean),public.blue_disable_forward_read(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.host_enable_forward_read(uuid,boolean),public.blue_disable_forward_read(uuid) TO authenticated;
CREATE POLICY forward_read_host_broadcast ON realtime.messages FOR SELECT TO authenticated USING (extension='broadcast' AND realtime.topic() ~ '^forward-read:[0-9a-fA-F-]{36}$' AND public.is_admin(auth.uid()) AND public.is_session_host(substring(realtime.topic() from 14)::uuid,auth.uid()));