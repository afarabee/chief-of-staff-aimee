-- Create prescriptions table for Rx list
CREATE TABLE IF NOT EXISTS prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_name text NOT NULL,
  dosage text,
  frequency text,
  prescriber text,
  pharmacy text,
  start_date date,
  end_date date,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

-- Allow all operations (matches existing app pattern - no auth)
CREATE POLICY "Allow all access to prescriptions" ON prescriptions
  FOR ALL USING (true) WITH CHECK (true);
