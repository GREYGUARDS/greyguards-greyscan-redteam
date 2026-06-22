
-- sentiment_history: remove cross-user access via user_brand_access
DROP POLICY IF EXISTS "Users can view own brand sentiment data" ON public.sentiment_history;
DROP POLICY IF EXISTS "Users can insert sentiment data for accessible brands" ON public.sentiment_history;

CREATE POLICY "Users can view own sentiment data"
ON public.sentiment_history FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sentiment data"
ON public.sentiment_history FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- user_brand_access: tighten INSERT so users can't register arbitrary brand names
DROP POLICY IF EXISTS "Users can add own brand access" ON public.user_brand_access;

CREATE POLICY "Users can add access to brands they own"
ON public.user_brand_access FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.sentiment_history s
    WHERE s.user_id = auth.uid()
      AND s.brand_name = user_brand_access.brand_name
  )
);

-- realtime.messages: require authentication to subscribe
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read realtime messages" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated users can send realtime messages" ON realtime.messages;

CREATE POLICY "Authenticated users can read realtime messages"
ON realtime.messages FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can send realtime messages"
ON realtime.messages FOR INSERT TO authenticated
WITH CHECK (true);
