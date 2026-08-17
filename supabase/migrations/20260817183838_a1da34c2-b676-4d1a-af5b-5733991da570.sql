DROP POLICY IF EXISTS "Users can view own requests" ON public.platform_access_requests;
CREATE POLICY "Users can view own requests"
ON public.platform_access_requests
FOR SELECT
TO authenticated
USING (lower(email) = lower(COALESCE((auth.jwt() ->> 'email'), '')));

DROP POLICY IF EXISTS "Submit access request (no impersonation)" ON public.platform_access_requests;
CREATE POLICY "Submit access request (no impersonation)"
ON public.platform_access_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'pending'
  AND approved_by IS NULL
  AND approved_at IS NULL
  AND decision_notes IS NULL
  AND (
    auth.uid() IS NULL
    OR lower(email) = lower(COALESCE((auth.jwt() ->> 'email'), ''))
  )
);