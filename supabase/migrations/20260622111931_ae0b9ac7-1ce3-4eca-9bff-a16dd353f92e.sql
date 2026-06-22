
-- 1. Add approval & verification columns
ALTER TABLE public.platform_access_requests
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS decision_notes text,
  ADD COLUMN IF NOT EXISTS email_domain_matches_brand boolean;

-- 2. Trigger to compute email/brand match heuristic on insert
CREATE OR REPLACE FUNCTION public.set_request_brand_verification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _domain text;
  _brand_norm text;
  _domain_root text;
BEGIN
  _domain := lower(split_part(NEW.email, '@', 2));
  _brand_norm := lower(regexp_replace(coalesce(NEW.brand_name,''), '[^a-z0-9]', '', 'g'));
  _domain_root := regexp_replace(split_part(_domain, '.', 1), '[^a-z0-9]', '', 'g');
  IF _domain = '' OR _brand_norm = '' THEN
    NEW.email_domain_matches_brand := false;
  ELSE
    NEW.email_domain_matches_brand :=
      (_domain_root = _brand_norm)
      OR (_brand_norm LIKE '%' || _domain_root || '%' AND length(_domain_root) >= 3)
      OR (_domain_root LIKE '%' || _brand_norm || '%' AND length(_brand_norm) >= 3);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_set_request_brand_verification ON public.platform_access_requests;
CREATE TRIGGER trg_set_request_brand_verification
BEFORE INSERT ON public.platform_access_requests
FOR EACH ROW EXECUTE FUNCTION public.set_request_brand_verification();

-- 3. Tighten user_brand_access: only admins (or service_role) may insert
DROP POLICY IF EXISTS "Users can insert own brand only if none or admin" ON public.user_brand_access;
DROP POLICY IF EXISTS "Users can add own brand access" ON public.user_brand_access;
CREATE POLICY "Only admins can grant brand access"
ON public.user_brand_access FOR INSERT TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Also ensure non-admins cannot update/delete their own row to escalate brand
DROP POLICY IF EXISTS "Users can update own brand access" ON public.user_brand_access;
DROP POLICY IF EXISTS "Users can delete own brand access" ON public.user_brand_access;
CREATE POLICY "Only admins can update brand access"
ON public.user_brand_access FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Only admins can delete brand access"
ON public.user_brand_access FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

-- 4. Admin approve/reject RPCs
CREATE OR REPLACE FUNCTION public.admin_approve_access_request(_request_id uuid, _notes text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _req public.platform_access_requests%ROWTYPE;
  _user_id uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'admin only';
  END IF;
  SELECT * INTO _req FROM public.platform_access_requests WHERE id = _request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'request not found'; END IF;

  SELECT id INTO _user_id FROM auth.users WHERE lower(email) = lower(_req.email) LIMIT 1;

  IF _user_id IS NOT NULL THEN
    INSERT INTO public.user_brand_access (user_id, brand_name)
    VALUES (_user_id, _req.brand_name)
    ON CONFLICT DO NOTHING;
  END IF;

  UPDATE public.platform_access_requests
     SET status = CASE WHEN _user_id IS NULL THEN 'approved_pending_signup' ELSE 'approved' END,
         approved_by = auth.uid(),
         approved_at = now(),
         decision_notes = _notes
   WHERE id = _request_id;

  RETURN jsonb_build_object(
    'request_id', _request_id,
    'provisioned', _user_id IS NOT NULL,
    'status', CASE WHEN _user_id IS NULL THEN 'approved_pending_signup' ELSE 'approved' END
  );
END $$;

CREATE OR REPLACE FUNCTION public.admin_reject_access_request(_request_id uuid, _notes text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'admin only';
  END IF;
  UPDATE public.platform_access_requests
     SET status = 'rejected',
         approved_by = auth.uid(),
         approved_at = now(),
         decision_notes = _notes
   WHERE id = _request_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'request not found'; END IF;
END $$;

GRANT EXECUTE ON FUNCTION public.admin_approve_access_request(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reject_access_request(uuid, text) TO authenticated;
