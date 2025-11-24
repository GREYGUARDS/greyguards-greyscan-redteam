-- Create table for brand-associated people
CREATE TABLE public.brand_people (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_name TEXT NOT NULL,
  user_id UUID NOT NULL,
  person_name TEXT NOT NULL,
  person_role TEXT NOT NULL,
  discovered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(brand_name, user_id, person_name)
);

-- Enable RLS
ALTER TABLE public.brand_people ENABLE ROW LEVEL SECURITY;

-- RLS policies for brand_people
CREATE POLICY "Users can view own brand people"
  ON public.brand_people
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brand people"
  ON public.brand_people
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own brand people"
  ON public.brand_people
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create table for person mentions history
CREATE TABLE public.person_mentions_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id UUID NOT NULL REFERENCES public.brand_people(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL,
  user_id UUID NOT NULL,
  mention_count INTEGER NOT NULL DEFAULT 0,
  sentiment_score NUMERIC NOT NULL,
  positive_count INTEGER NOT NULL DEFAULT 0,
  negative_count INTEGER NOT NULL DEFAULT 0,
  neutral_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.person_mentions_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for person_mentions_history
CREATE POLICY "Users can view own person mentions"
  ON public.person_mentions_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own person mentions"
  ON public.person_mentions_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own person mentions"
  ON public.person_mentions_history
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create table for person MDM narratives
CREATE TABLE public.person_mdm_narratives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id UUID NOT NULL REFERENCES public.brand_people(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL,
  user_id UUID NOT NULL,
  narrative_id TEXT NOT NULL,
  narrative_type TEXT NOT NULL,
  narrative_description TEXT NOT NULL,
  severity TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  frequency INTEGER NOT NULL DEFAULT 0,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.person_mdm_narratives ENABLE ROW LEVEL SECURITY;

-- RLS policies for person_mdm_narratives
CREATE POLICY "Users can view own person narratives"
  ON public.person_mdm_narratives
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own person narratives"
  ON public.person_mdm_narratives
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own person narratives"
  ON public.person_mdm_narratives
  FOR DELETE
  USING (auth.uid() = user_id);