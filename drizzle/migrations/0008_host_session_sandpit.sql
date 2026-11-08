ALTER TABLE public.exercise_sessions ADD COLUMN IF NOT EXISTS preparation_config jsonb NOT NULL DEFAULT '{}'::jsonb, ADD COLUMN IF NOT EXISTS preparation_notes text NOT NULL DEFAULT '', ADD COLUMN IF NOT EXISTS session_label text, ADD COLUMN IF NOT EXISTS opened_at timestamptz;
ALTER POLICY "Authenticated users can create their own sessions" ON public.exercise_sessions WITH CHECK (created_by_user_id = auth.uid() AND public.is_admin(auth.uid()));
CREATE OR REPLACE FUNCTION public.lookup_session_by_code(_code text)
RETURNS TABLE(id uuid, session_code text, brand_name text, status text, team_mode text, duration integer, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
SELECT s.id,s.session_code,s.brand_name,s.status,s.team_mode,s.duration,s.created_at FROM public.exercise_sessions s WHERE s.session_code=upper(_code) AND s.status IN ('waiting','active','paused') AND coalesce(s.opened_at,s.started_at,s.created_at)>now()-interval '24 hours' LIMIT 1;
$$;
CREATE OR REPLACE FUNCTION public.guard_preparation_team_join() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
IF NOT EXISTS (SELECT 1 FROM public.exercise_sessions s WHERE s.id=NEW.session_id AND s.status IN ('waiting','active','paused') AND coalesce(s.opened_at,s.started_at,s.created_at)>now()-interval '24 hours') THEN RAISE EXCEPTION 'Session is not open to participants'; END IF;
RETURN NEW;
END $$;
CREATE TRIGGER guard_preparation_team_join BEFORE INSERT OR UPDATE ON public.exercise_teams FOR EACH ROW EXECUTE FUNCTION public.guard_preparation_team_join();
CREATE OR REPLACE FUNCTION public.host_fire_prepared_inject(_inject_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
IF NOT EXISTS (SELECT 1 FROM public.exercise_injects i JOIN public.exercise_sessions s ON s.id=i.session_id WHERE i.id=_inject_id AND s.created_by_user_id=auth.uid() AND public.is_admin(auth.uid()) AND s.status='active') THEN RAISE EXCEPTION 'Only the authorised host can send into an active session'; END IF;
UPDATE public.exercise_injects SET is_sent=true,sent_at=now() WHERE id=_inject_id AND NOT is_sent;
END $$;
REVOKE ALL ON FUNCTION public.host_fire_prepared_inject(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.host_fire_prepared_inject(uuid) TO authenticated,service_role;
REVOKE ALL ON FUNCTION public.guard_preparation_team_join() FROM PUBLIC,anon,authenticated;