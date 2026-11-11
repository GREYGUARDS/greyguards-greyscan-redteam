CREATE OR REPLACE FUNCTION public.is_admin(_uid uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
    JOIN public.app_admins a ON lower(a.email) = lower(u.email)
    WHERE u.id = _uid
      AND u.email_confirmed_at IS NOT NULL
      AND lower(split_part(u.email, '@', 2)) = 'greyguards.com'
  );
$$;
ALTER TABLE public.app_admins ADD CONSTRAINT app_admins_greyguards_domain CHECK (lower(split_part(email, '@', 2)) = 'greyguards.com');