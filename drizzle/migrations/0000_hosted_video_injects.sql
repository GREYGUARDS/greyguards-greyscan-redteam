ALTER TABLE public.exercise_injects ADD COLUMN video_storage_path text;
CREATE TABLE public.exercise_video_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 session_id uuid NOT NULL REFERENCES public.exercise_sessions(id) ON DELETE CASCADE,
 user_id uuid NOT NULL,
 provider_job_id text,
 status text NOT NULL DEFAULT 'creating' CHECK (status IN ('creating','queued','in_progress','completed','failed')),
 progress integer NOT NULL DEFAULT 0,
 script text NOT NULL,
 speaker text NOT NULL,
 storage_path text,
 error_message text,
 error_code text,
 access_paused boolean NOT NULL DEFAULT false,
 inject_id uuid REFERENCES public.exercise_injects(id),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.exercise_video_jobs TO authenticated;
GRANT ALL ON public.exercise_video_jobs TO service_role;
ALTER TABLE public.exercise_video_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Host reads own video jobs" ON public.exercise_video_jobs FOR SELECT TO authenticated USING (user_id = auth.uid() AND public.is_admin(auth.uid()) AND EXISTS (SELECT 1 FROM public.exercise_sessions s WHERE s.id = session_id AND s.created_by_user_id = auth.uid()));
CREATE UNIQUE INDEX exercise_video_one_active ON public.exercise_video_jobs ((true)) WHERE status IN ('creating','queued','in_progress');
CREATE POLICY "Session participants read published exercise videos" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'exercise-videos' AND EXISTS (SELECT 1 FROM public.exercise_injects i WHERE i.video_storage_path = name AND i.is_sent AND public.is_session_participant(i.session_id, auth.uid())));
CREATE POLICY "Host reads own exercise video previews" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'exercise-videos' AND EXISTS (SELECT 1 FROM public.exercise_video_jobs j WHERE j.storage_path = name AND j.user_id = auth.uid() AND public.is_admin(auth.uid())));