-- Create handoff_summaries table for tracking session handoff notes
-- Referenced by send-daily-digest edge function and useHandoffSummaries hook
CREATE TABLE IF NOT EXISTS handoff_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_date date NOT NULL,
  project_name text NOT NULL,
  tools text[] DEFAULT '{}',
  completed text[] DEFAULT '{}',
  in_progress text[] DEFAULT '{}',
  next_steps text[] DEFAULT '{}',
  resume_command text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS (matches existing app pattern)
ALTER TABLE handoff_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to handoff_summaries" ON handoff_summaries
  FOR ALL USING (true) WITH CHECK (true);

-- Index for the date-range query used by the digest
CREATE INDEX idx_handoff_summaries_session_date ON handoff_summaries (session_date DESC);
