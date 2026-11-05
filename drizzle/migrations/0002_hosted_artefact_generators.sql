ALTER TABLE public.exercise_video_jobs ADD COLUMN video_kind text NOT NULL DEFAULT 'influencer' CHECK (video_kind IN ('influencer','news'));
ALTER TABLE public.exercise_injects ADD COLUMN artefact jsonb;
CREATE TABLE public.exercise_artefact_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), session_id uuid NOT NULL REFERENCES public.exercise_sessions(id) ON DELETE CASCADE, user_id uuid NOT NULL, ip_hash text NOT NULL, kind text NOT NULL CHECK (kind IN ('website','x','whatsapp','telegram','facebook')), brief text NOT NULL, artefact jsonb, status text NOT NULL DEFAULT 'generating' CHECK (status IN ('generating','completed','failed')), error_message text, access_paused boolean NOT NULL DEFAULT false, inject_id uuid REFERENCES public.exercise_injects(id), created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.exercise_artefact_jobs TO authenticated;
GRANT ALL ON public.exercise_artefact_jobs TO service_role;
ALTER TABLE public.exercise_artefact_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Hosts read own generated artefacts" ON public.exercise_artefact_jobs FOR SELECT TO authenticated USING (user_id = auth.uid() AND public.is_admin(auth.uid()) AND EXISTS (SELECT 1 FROM public.exercise_sessions s WHERE s.id = session_id AND s.created_by_user_id = auth.uid()));
CREATE INDEX exercise_artefact_jobs_rate_limit ON public.exercise_artefact_jobs(user_id, created_at);
CREATE INDEX exercise_artefact_jobs_ip_rate_limit ON public.exercise_artefact_jobs(ip_hash, created_at);