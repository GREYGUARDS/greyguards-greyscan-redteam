CREATE OR REPLACE FUNCTION public.guard_preparation_team_join() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
IF TG_OP='UPDATE' AND NOT NEW.is_connected AND NEW.session_id IS NOT DISTINCT FROM OLD.session_id AND NEW.user_id IS NOT DISTINCT FROM OLD.user_id AND NEW.team_type IS NOT DISTINCT FROM OLD.team_type THEN RETURN NEW; END IF;
IF NOT EXISTS (SELECT 1 FROM public.exercise_sessions s WHERE s.id=NEW.session_id AND s.status IN ('waiting','active','paused') AND coalesce(s.opened_at,s.started_at,s.created_at)>now()-interval '24 hours') THEN RAISE EXCEPTION 'Session is not open to participants'; END IF;
RETURN NEW;
END $$;