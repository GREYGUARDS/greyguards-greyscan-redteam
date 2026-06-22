
-- Scope per-user data policies to the authenticated role only (drop default {public})
-- brand_people
DROP POLICY IF EXISTS "Users can delete own brand people" ON public.brand_people;
DROP POLICY IF EXISTS "Users can insert own brand people" ON public.brand_people;
DROP POLICY IF EXISTS "Users can update own brand people" ON public.brand_people;
DROP POLICY IF EXISTS "Users can view own brand people" ON public.brand_people;
CREATE POLICY "Users can view own brand people" ON public.brand_people FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own brand people" ON public.brand_people FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own brand people" ON public.brand_people FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own brand people" ON public.brand_people FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- mdm_alerts
DROP POLICY IF EXISTS "Users can delete own alerts" ON public.mdm_alerts;
DROP POLICY IF EXISTS "Users can insert own alerts" ON public.mdm_alerts;
DROP POLICY IF EXISTS "Users can update own alerts" ON public.mdm_alerts;
DROP POLICY IF EXISTS "Users can view own alerts" ON public.mdm_alerts;
CREATE POLICY "Users can view own alerts" ON public.mdm_alerts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own alerts" ON public.mdm_alerts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own alerts" ON public.mdm_alerts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own alerts" ON public.mdm_alerts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- mdm_narratives_history
DROP POLICY IF EXISTS "Users can delete own narrative history" ON public.mdm_narratives_history;
DROP POLICY IF EXISTS "Users can insert own narrative history" ON public.mdm_narratives_history;
DROP POLICY IF EXISTS "Users can view own narrative history" ON public.mdm_narratives_history;
CREATE POLICY "Users can view own narrative history" ON public.mdm_narratives_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own narrative history" ON public.mdm_narratives_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own narrative history" ON public.mdm_narratives_history FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- person_mdm_narratives
DROP POLICY IF EXISTS "Users can delete own person narratives" ON public.person_mdm_narratives;
DROP POLICY IF EXISTS "Users can insert own person narratives" ON public.person_mdm_narratives;
DROP POLICY IF EXISTS "Users can view own person narratives" ON public.person_mdm_narratives;
CREATE POLICY "Users can view own person narratives" ON public.person_mdm_narratives FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own person narratives" ON public.person_mdm_narratives FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own person narratives" ON public.person_mdm_narratives FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- person_mentions_history
DROP POLICY IF EXISTS "Users can delete own person mentions" ON public.person_mentions_history;
DROP POLICY IF EXISTS "Users can insert own person mentions" ON public.person_mentions_history;
DROP POLICY IF EXISTS "Users can view own person mentions" ON public.person_mentions_history;
CREATE POLICY "Users can view own person mentions" ON public.person_mentions_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own person mentions" ON public.person_mentions_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own person mentions" ON public.person_mentions_history FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- platform_access_requests: drop redundant always-true insert policy; keep the stricter "Submit access request (no impersonation)" policy already in place
DROP POLICY IF EXISTS "anyone can submit access request" ON public.platform_access_requests;
