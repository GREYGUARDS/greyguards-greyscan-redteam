-- Create sentiment_history table to track sentiment over time
CREATE TABLE IF NOT EXISTS public.sentiment_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_name TEXT NOT NULL,
  sentiment_score DECIMAL NOT NULL,
  positive_count INTEGER NOT NULL,
  negative_count INTEGER NOT NULL,
  neutral_count INTEGER NOT NULL,
  total_mentions INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.sentiment_history ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since this is public data)
CREATE POLICY "Allow all access to sentiment_history"
ON public.sentiment_history
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster queries by brand and date
CREATE INDEX idx_sentiment_history_brand_date ON public.sentiment_history(brand_name, created_at DESC);

-- Create index for faster queries by date
CREATE INDEX idx_sentiment_history_created_at ON public.sentiment_history(created_at DESC);