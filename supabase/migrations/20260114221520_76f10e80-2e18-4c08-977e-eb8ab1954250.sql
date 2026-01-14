-- Add missing UPDATE policy for brand_people table
CREATE POLICY "Users can update own brand people"
ON public.brand_people
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);