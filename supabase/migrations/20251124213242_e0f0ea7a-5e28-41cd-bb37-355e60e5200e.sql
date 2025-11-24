-- Create MDM narratives history table
CREATE TABLE public.mdm_narratives_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  brand_name TEXT NOT NULL,
  narrative_id TEXT NOT NULL,
  narrative_type TEXT NOT NULL,
  narrative_description TEXT NOT NULL,
  severity TEXT NOT NULL,
  frequency INTEGER NOT NULL DEFAULT 0,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_mdm_narratives_brand_user ON public.mdm_narratives_history(brand_name, user_id, detected_at DESC);
CREATE INDEX idx_mdm_narratives_narrative_id ON public.mdm_narratives_history(narrative_id, brand_name, user_id);

-- Enable Row Level Security
ALTER TABLE public.mdm_narratives_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own narrative history
CREATE POLICY "Users can view own narrative history"
ON public.mdm_narratives_history
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own narrative history
CREATE POLICY "Users can insert own narrative history"
ON public.mdm_narratives_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own narrative history
CREATE POLICY "Users can delete own narrative history"
ON public.mdm_narratives_history
FOR DELETE
USING (auth.uid() = user_id);

-- Create MDM alerts table
CREATE TABLE public.mdm_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  brand_name TEXT NOT NULL,
  alert_type TEXT NOT NULL, -- 'new_narrative' or 'surge'
  narrative_id TEXT NOT NULL,
  narrative_description TEXT NOT NULL,
  severity TEXT NOT NULL,
  previous_frequency INTEGER,
  current_frequency INTEGER,
  frequency_change_percent NUMERIC,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster alert queries
CREATE INDEX idx_mdm_alerts_user_brand ON public.mdm_alerts(user_id, brand_name, created_at DESC);
CREATE INDEX idx_mdm_alerts_unread ON public.mdm_alerts(user_id, is_read, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.mdm_alerts ENABLE ROW LEVEL SECURITY;

-- Users can view their own alerts
CREATE POLICY "Users can view own alerts"
ON public.mdm_alerts
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own alerts
CREATE POLICY "Users can insert own alerts"
ON public.mdm_alerts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own alerts (mark as read)
CREATE POLICY "Users can update own alerts"
ON public.mdm_alerts
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own alerts
CREATE POLICY "Users can delete own alerts"
ON public.mdm_alerts
FOR DELETE
USING (auth.uid() = user_id);