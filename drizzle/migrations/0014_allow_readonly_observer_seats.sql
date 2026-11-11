ALTER TABLE public.exercise_teams DROP CONSTRAINT exercise_teams_team_type_check;
ALTER TABLE public.exercise_teams ADD CONSTRAINT exercise_teams_team_type_check CHECK (team_type IN ('blue', 'red', 'observer'));
ALTER TABLE public.exercise_teams DROP CONSTRAINT exercise_teams_session_id_team_type_key;
CREATE UNIQUE INDEX exercise_teams_active_team_unique ON public.exercise_teams (session_id, team_type) WHERE team_type IN ('blue', 'red');
CREATE UNIQUE INDEX exercise_teams_observer_user_unique ON public.exercise_teams (session_id, user_id) WHERE team_type = 'observer';
ALTER TABLE public.exercise_teams ADD CONSTRAINT exercise_teams_observer_user_required CHECK (team_type <> 'observer' OR user_id IS NOT NULL);
