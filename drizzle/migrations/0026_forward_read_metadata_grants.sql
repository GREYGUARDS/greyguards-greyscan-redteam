REVOKE ALL ON public.forward_read_agreements FROM anon, authenticated, PUBLIC;
GRANT SELECT ON public.forward_read_agreements TO authenticated;
GRANT ALL ON public.forward_read_agreements TO service_role;
REVOKE ALL ON public.forward_read_usage FROM anon,authenticated,PUBLIC;
GRANT ALL ON public.forward_read_usage TO service_role;