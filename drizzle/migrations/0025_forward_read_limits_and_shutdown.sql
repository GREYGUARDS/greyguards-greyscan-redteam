CREATE TABLE public.forward_read_usage (ip_hash text NOT NULL,hour_start timestamptz NOT NULL, requests integer NOT NULL DEFAULT 0, PRIMARY KEY(ip_hash,hour_start));
GRANT ALL ON public.forward_read_usage TO service_role;
ALTER TABLE public.forward_read_usage ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.claim_forward_read_request(_ip_hash text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE n integer; BEGIN INSERT INTO public.forward_read_usage(ip_hash,hour_start,requests) VALUES(_ip_hash,date_trunc('hour',now()),1) ON CONFLICT(ip_hash,hour_start) DO UPDATE SET requests=forward_read_usage.requests+1 RETURNING requests INTO n; RETURN n<=10; END $$;
CREATE OR REPLACE FUNCTION public.stop_forward_read_request(_session_id uuid,_version uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN PERFORM set_config('app.forward_read_mutation','on',true); UPDATE public.exercise_sessions SET room_audio_enabled=false,forward_read_version=gen_random_uuid() WHERE id=_session_id AND forward_read_version=_version; END $$;
REVOKE ALL ON FUNCTION public.claim_forward_read_request(text),public.stop_forward_read_request(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_forward_read_request(text),public.stop_forward_read_request(uuid,uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.guard_forward_read() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF TG_OP='INSERT' THEN
  NEW.room_audio_enabled := false; NEW.forward_read_agreed_by := NULL; NEW.forward_read_agreed_at := NULL; NEW.forward_read_paused_at := NULL;
 ELSE
  IF (NEW.room_audio_enabled IS DISTINCT FROM OLD.room_audio_enabled OR NEW.forward_read_agreed_by IS DISTINCT FROM OLD.forward_read_agreed_by OR NEW.forward_read_agreed_at IS DISTINCT FROM OLD.forward_read_agreed_at OR NEW.forward_read_version IS DISTINCT FROM OLD.forward_read_version) AND coalesce(current_setting('app.forward_read_mutation',true),'') <> 'on' THEN RAISE EXCEPTION 'Use Forward Read agreement controls'; END IF;
  NEW.forward_read_paused_at := OLD.forward_read_paused_at;
  IF NEW.status='paused' AND OLD.status<>'paused' THEN NEW.forward_read_paused_at := now(); END IF;
  IF NEW.status NOT IN ('active','paused') OR (NEW.status='active' AND OLD.status='paused' AND OLD.forward_read_paused_at <= now()-interval '30 minutes') THEN NEW.room_audio_enabled := false; NEW.forward_read_version := gen_random_uuid(); END IF;
  IF NEW.status<>'paused' THEN NEW.forward_read_paused_at := NULL; END IF;
 END IF;
 RETURN NEW;
END $$;