CREATE OR REPLACE FUNCTION public.claim_brand_access()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email text;
  _brand text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT lower(u.email) INTO _email FROM auth.users u WHERE u.id = auth.uid();
  IF _email IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT r.brand_name INTO _brand
  FROM public.platform_access_requests r
  WHERE lower(r.email) = _email
    AND r.status IN ('approved', 'approved_pending_signup')
  ORDER BY r.approved_at DESC NULLS LAST
  LIMIT 1;

  IF _brand IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.user_brand_access (user_id, brand_name)
  VALUES (auth.uid(), _brand)
  ON CONFLICT DO NOTHING;

  UPDATE public.platform_access_requests
     SET status = 'approved'
   WHERE lower(email) = _email
     AND status = 'approved_pending_signup';

  RETURN _brand;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_brand_access() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_brand_access() FROM anon;
GRANT EXECUTE ON FUNCTION public.claim_brand_access() TO authenticated;