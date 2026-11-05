CREATE OR REPLACE FUNCTION public.enforce_hosted_generation_limit() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE user_count integer; ip_count integer;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('hosted_generation_limit', 0));
 IF TG_TABLE_NAME = 'exercise_video_jobs' THEN
  SELECT count(*) INTO user_count FROM public.exercise_video_jobs WHERE user_id = NEW.user_id AND created_at > now() - interval '1 hour';
  SELECT count(*) INTO ip_count FROM public.exercise_video_jobs WHERE ip_hash = NEW.ip_hash AND created_at > now() - interval '1 hour';
 ELSE
  SELECT count(*) INTO user_count FROM public.exercise_artefact_jobs WHERE user_id = NEW.user_id AND created_at > now() - interval '1 hour';
  SELECT count(*) INTO ip_count FROM public.exercise_artefact_jobs WHERE ip_hash = NEW.ip_hash AND created_at > now() - interval '1 hour';
 END IF;
 IF user_count >= 10 OR ip_count >= 10 THEN RAISE EXCEPTION 'The hourly limit of 10 generation requests has been reached.' USING ERRCODE = 'P0001'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.enforce_hosted_generation_limit() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER exercise_video_generation_limit BEFORE INSERT ON public.exercise_video_jobs FOR EACH ROW EXECUTE FUNCTION public.enforce_hosted_generation_limit();
CREATE TRIGGER exercise_artefact_generation_limit BEFORE INSERT ON public.exercise_artefact_jobs FOR EACH ROW EXECUTE FUNCTION public.enforce_hosted_generation_limit();