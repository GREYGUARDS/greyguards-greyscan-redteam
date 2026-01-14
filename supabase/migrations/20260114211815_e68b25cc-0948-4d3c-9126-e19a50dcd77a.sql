-- Create table for exercise sessions
CREATE TABLE public.exercise_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_code TEXT NOT NULL UNIQUE,
  brand_name TEXT NOT NULL,
  duration INTEGER NOT NULL DEFAULT 10,
  team_mode TEXT NOT NULL DEFAULT 'solo',
  scenario_title TEXT,
  scenario_narrative TEXT,
  status TEXT NOT NULL DEFAULT 'waiting', -- waiting, active, completed
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  blue_team_score JSONB,
  red_team_score JSONB
);

-- Create table for team participants
CREATE TABLE public.exercise_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.exercise_sessions(id) ON DELETE CASCADE NOT NULL,
  team_type TEXT NOT NULL CHECK (team_type IN ('blue', 'red')),
  team_name TEXT DEFAULT 'Team',
  is_connected BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  narrative_control INTEGER DEFAULT 50,
  reputation_damage INTEGER DEFAULT 20,
  decisions_correct INTEGER DEFAULT 0,
  decisions_total INTEGER DEFAULT 0,
  UNIQUE(session_id, team_type)
);

-- Create table for injects (attacks from red team or system)
CREATE TABLE public.exercise_injects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.exercise_sessions(id) ON DELETE CASCADE NOT NULL,
  created_by TEXT NOT NULL DEFAULT 'system', -- 'system' or 'red_team'
  inject_type TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT NOT NULL,
  reach INTEGER DEFAULT 10000,
  sentiment TEXT DEFAULT 'hostile',
  is_aggressive BOOLEAN DEFAULT false,
  timestamp_offset INTEGER NOT NULL DEFAULT 0, -- seconds from start
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for responses
CREATE TABLE public.exercise_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.exercise_sessions(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES public.exercise_teams(id) ON DELETE CASCADE NOT NULL,
  inject_id UUID REFERENCES public.exercise_injects(id) ON DELETE CASCADE NOT NULL,
  response_label TEXT NOT NULL,
  response_type TEXT NOT NULL,
  effectiveness INTEGER NOT NULL,
  response_time_seconds NUMERIC NOT NULL,
  was_correct BOOLEAN NOT NULL,
  custom_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.exercise_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_injects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_responses ENABLE ROW LEVEL SECURITY;

-- Policies for public access (code-based joining, no auth required)
CREATE POLICY "Anyone can view sessions by code" 
ON public.exercise_sessions FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create sessions" 
ON public.exercise_sessions FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update sessions" 
ON public.exercise_sessions FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can view teams" 
ON public.exercise_teams FOR SELECT 
USING (true);

CREATE POLICY "Anyone can join teams" 
ON public.exercise_teams FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update teams" 
ON public.exercise_teams FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can view injects" 
ON public.exercise_injects FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create injects" 
ON public.exercise_injects FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update injects" 
ON public.exercise_injects FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can view responses" 
ON public.exercise_responses FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create responses" 
ON public.exercise_responses FOR INSERT 
WITH CHECK (true);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.exercise_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.exercise_teams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.exercise_injects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.exercise_responses;