-- Convert get_my_locked_brand from SECURITY DEFINER to SECURITY INVOKER.
-- It only reads the caller's own row from user_brand_access (scoped via auth.uid()),
-- which RLS already permits the user to SELECT, so DEFINER is unnecessary.
CREATE OR REPLACE FUNCTION public.get_my_locked_brand()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
  SELECT brand_name FROM public.user_brand_access
  WHERE user_id = auth.uid()
  ORDER BY created_at ASC LIMIT 1;
$function$;