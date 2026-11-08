ALTER TABLE public.exercise_sessions ADD COLUMN board_synthetic_speech_approved boolean NOT NULL DEFAULT false, ADD COLUMN board_speech_approval_by uuid, ADD COLUMN board_speech_approval_at timestamptz;
ALTER TABLE public.exercise_video_jobs DROP CONSTRAINT exercise_video_jobs_video_kind_check;
ALTER TABLE public.exercise_video_jobs ADD CONSTRAINT exercise_video_jobs_video_kind_check CHECK (video_kind IN ('influencer','news','board'));
ALTER TABLE public.exercise_video_jobs ADD COLUMN watermark_applied boolean NOT NULL DEFAULT false, ADD COLUMN host_reviewed_by uuid, ADD COLUMN host_reviewed_at timestamptz;
CREATE OR REPLACE FUNCTION public.guard_board_video_publication() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE j public.exercise_video_jobs; s public.exercise_sessions;
BEGIN
 IF NEW.is_sent AND NOT COALESCE(OLD.is_sent,false) AND NEW.video_storage_path IS NOT NULL THEN
  SELECT * INTO j FROM public.exercise_video_jobs WHERE storage_path=NEW.video_storage_path AND session_id=NEW.session_id AND video_kind='board' LIMIT 1;
  IF FOUND THEN
   SELECT * INTO s FROM public.exercise_sessions WHERE id=NEW.session_id;
   IF NOT s.real_board_members_approved OR s.board_approval_recorded_by IS DISTINCT FROM s.created_by_user_id OR NOT s.board_synthetic_speech_approved OR s.board_speech_approval_by IS DISTINCT FROM s.created_by_user_id OR NOT j.watermark_applied OR j.host_reviewed_by IS DISTINCT FROM s.created_by_user_id OR j.host_reviewed_at IS NULL THEN
    RAISE EXCEPTION 'Board video requires current client approval, a permanent watermark and host review';
   END IF;
  END IF;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_board_video_publication() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_board_video_publication BEFORE INSERT OR UPDATE ON public.exercise_injects FOR EACH ROW EXECUTE FUNCTION public.guard_board_video_publication();