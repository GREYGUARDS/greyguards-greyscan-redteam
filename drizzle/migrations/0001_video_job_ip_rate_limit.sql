ALTER TABLE public.exercise_video_jobs ADD COLUMN ip_hash text;
CREATE INDEX exercise_video_jobs_rate_limit ON public.exercise_video_jobs(user_id, created_at);
CREATE INDEX exercise_video_jobs_ip_rate_limit ON public.exercise_video_jobs(ip_hash, created_at);