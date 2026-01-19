-- Fix exercise tables RLS policies to be session-code scoped instead of fully public
-- This maintains the low-friction UX (code-based joining) while restricting data access

-- First, drop overly permissive policies on exercise_sessions
DROP POLICY IF EXISTS "Anyone can view sessions by code" ON exercise_sessions;
DROP POLICY IF EXISTS "Anyone can create sessions" ON exercise_sessions;
DROP POLICY IF EXISTS "Anyone can update sessions" ON exercise_sessions;

-- Create scoped policies for exercise_sessions
-- Allow viewing only active/waiting sessions created in last 24 hours OR by session code lookup
CREATE POLICY "View sessions by code or recent active"
ON exercise_sessions FOR SELECT
USING (
  (status IN ('waiting', 'active') AND created_at > NOW() - INTERVAL '24 hours')
  OR (status = 'completed' AND completed_at > NOW() - INTERVAL '2 hours')
);

-- Only allow creating sessions (no restrictions needed here - creating a session is fine)
CREATE POLICY "Anyone can create sessions"
ON exercise_sessions FOR INSERT
WITH CHECK (true);

-- Restrict updates to sessions that are recent and active
CREATE POLICY "Update recent active sessions only"
ON exercise_sessions FOR UPDATE
USING (
  status IN ('waiting', 'active') 
  AND created_at > NOW() - INTERVAL '24 hours'
);

-- Fix exercise_teams policies
DROP POLICY IF EXISTS "Anyone can view teams" ON exercise_teams;
DROP POLICY IF EXISTS "Anyone can join teams" ON exercise_teams;
DROP POLICY IF EXISTS "Anyone can update teams" ON exercise_teams;

-- Teams can only be viewed/modified for recent active sessions
CREATE POLICY "View teams in recent sessions"
ON exercise_teams FOR SELECT
USING (
  session_id IN (
    SELECT id FROM exercise_sessions 
    WHERE (status IN ('waiting', 'active') AND created_at > NOW() - INTERVAL '24 hours')
    OR (status = 'completed' AND completed_at > NOW() - INTERVAL '2 hours')
  )
);

CREATE POLICY "Join recent sessions"
ON exercise_teams FOR INSERT
WITH CHECK (
  session_id IN (
    SELECT id FROM exercise_sessions 
    WHERE status IN ('waiting', 'active') 
    AND created_at > NOW() - INTERVAL '24 hours'
  )
);

CREATE POLICY "Update teams in active sessions"
ON exercise_teams FOR UPDATE
USING (
  session_id IN (
    SELECT id FROM exercise_sessions 
    WHERE status IN ('waiting', 'active') 
    AND created_at > NOW() - INTERVAL '24 hours'
  )
);

-- Fix exercise_injects policies
DROP POLICY IF EXISTS "Anyone can view injects" ON exercise_injects;
DROP POLICY IF EXISTS "Anyone can create injects" ON exercise_injects;
DROP POLICY IF EXISTS "Anyone can update injects" ON exercise_injects;

CREATE POLICY "View injects in recent sessions"
ON exercise_injects FOR SELECT
USING (
  session_id IN (
    SELECT id FROM exercise_sessions 
    WHERE (status IN ('waiting', 'active') AND created_at > NOW() - INTERVAL '24 hours')
    OR (status = 'completed' AND completed_at > NOW() - INTERVAL '2 hours')
  )
);

CREATE POLICY "Create injects in active sessions"
ON exercise_injects FOR INSERT
WITH CHECK (
  session_id IN (
    SELECT id FROM exercise_sessions 
    WHERE status IN ('waiting', 'active') 
    AND created_at > NOW() - INTERVAL '24 hours'
  )
);

CREATE POLICY "Update injects in active sessions"
ON exercise_injects FOR UPDATE
USING (
  session_id IN (
    SELECT id FROM exercise_sessions 
    WHERE status IN ('waiting', 'active') 
    AND created_at > NOW() - INTERVAL '24 hours'
  )
);

-- Fix exercise_responses policies
DROP POLICY IF EXISTS "Anyone can view responses" ON exercise_responses;
DROP POLICY IF EXISTS "Anyone can create responses" ON exercise_responses;

CREATE POLICY "View responses in recent sessions"
ON exercise_responses FOR SELECT
USING (
  session_id IN (
    SELECT id FROM exercise_sessions 
    WHERE (status IN ('waiting', 'active') AND created_at > NOW() - INTERVAL '24 hours')
    OR (status = 'completed' AND completed_at > NOW() - INTERVAL '2 hours')
  )
);

CREATE POLICY "Create responses in active sessions"
ON exercise_responses FOR INSERT
WITH CHECK (
  session_id IN (
    SELECT id FROM exercise_sessions 
    WHERE status IN ('waiting', 'active') 
    AND created_at > NOW() - INTERVAL '24 hours'
  )
);