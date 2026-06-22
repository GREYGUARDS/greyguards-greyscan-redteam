
-- Admin allowlist
CREATE TABLE IF NOT EXISTS public.app_admins (
  email text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_admins TO authenticated;
GRANT ALL ON public.app_admins TO service_role;
ALTER TABLE public.app_admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins readable to self" ON public.app_admins FOR SELECT TO authenticated
  USING (lower(email) = lower(coalesce((auth.jwt() ->> 'email'), '')));

INSERT INTO public.app_admins (email) VALUES ('info@greyguards.com')
ON CONFLICT (email) DO NOTHING;

-- is_admin helper
CREATE OR REPLACE FUNCTION public.is_admin(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
    JOIN public.app_admins a ON lower(a.email) = lower(u.email)
    WHERE u.id = _uid
  );
$$;

-- Platform access requests
CREATE TABLE IF NOT EXISTS public.platform_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  organisation text NOT NULL,
  email text NOT NULL,
  brand_name text NOT NULL,
  use_case text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.platform_access_requests TO anon, authenticated;
GRANT ALL ON public.platform_access_requests TO service_role;
ALTER TABLE public.platform_access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can submit access request" ON public.platform_access_requests
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admins read all requests" ON public.platform_access_requests
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "admins update requests" ON public.platform_access_requests
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

-- Helper to fetch the single brand a user is locked to
CREATE OR REPLACE FUNCTION public.get_my_locked_brand()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT brand_name FROM public.user_brand_access
  WHERE user_id = auth.uid()
  ORDER BY created_at ASC LIMIT 1;
$$;

-- Restrict non-admins to a single brand row in user_brand_access
DROP POLICY IF EXISTS "Users can insert own brand only if none or admin" ON public.user_brand_access;
DROP POLICY IF EXISTS "Users can add own brand access" ON public.user_brand_access;
CREATE POLICY "Users can insert own brand only if none or admin"
ON public.user_brand_access FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (
    public.is_admin(auth.uid())
    OR NOT EXISTS (SELECT 1 FROM public.user_brand_access ub WHERE ub.user_id = auth.uid())
  )
);
