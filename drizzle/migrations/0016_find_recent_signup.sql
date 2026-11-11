CREATE OR REPLACE FUNCTION public.find_recent_signup(_email text)
RETURNS TABLE(id uuid, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT u.id, u.created_at FROM auth.users u
  WHERE lower(u.email) = lower(_email) AND u.created_at > now() - interval '15 minutes'
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.find_recent_signup(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.find_recent_signup(text) TO service_role;