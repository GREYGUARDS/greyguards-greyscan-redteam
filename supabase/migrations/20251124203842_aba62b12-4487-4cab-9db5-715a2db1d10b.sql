-- Create user_brand_access table to manage which brands each user can monitor
CREATE TABLE IF NOT EXISTS public.user_brand_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  brand_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, brand_name)
);

-- Enable RLS on user_brand_access
ALTER TABLE public.user_brand_access ENABLE ROW LEVEL SECURITY;

-- Users can only see their own brand access
CREATE POLICY "Users can view own brand access"
ON public.user_brand_access FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can add brands for themselves
CREATE POLICY "Users can add own brand access"
ON public.user_brand_access FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can remove their own brand access
CREATE POLICY "Users can delete own brand access"
ON public.user_brand_access FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Drop the overly permissive policy on sentiment_history
DROP POLICY IF EXISTS "Allow all access to sentiment_history" ON public.sentiment_history;

-- Add user_id column to sentiment_history if it doesn't exist
ALTER TABLE public.sentiment_history 
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_sentiment_history_user_id ON public.sentiment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_history_brand_name ON public.sentiment_history(brand_name);

-- Create secure RLS policies for sentiment_history
CREATE POLICY "Users can view own brand sentiment data"
ON public.sentiment_history FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.user_brand_access
    WHERE user_id = auth.uid() AND brand_name = sentiment_history.brand_name
  )
);

CREATE POLICY "Users can insert sentiment data for accessible brands"
ON public.sentiment_history FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.user_brand_access
    WHERE user_id = auth.uid() AND brand_name = sentiment_history.brand_name
  )
);

CREATE POLICY "Users can update own sentiment data"
ON public.sentiment_history FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sentiment data"
ON public.sentiment_history FOR DELETE
TO authenticated
USING (auth.uid() = user_id);