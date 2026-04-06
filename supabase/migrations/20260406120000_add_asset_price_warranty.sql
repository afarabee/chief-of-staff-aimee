-- Add price/worth and warranty fields to assets table
ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS purchase_price numeric NULL,
  ADD COLUMN IF NOT EXISTS current_value numeric NULL,
  ADD COLUMN IF NOT EXISTS warranty_expiry_date date NULL,
  ADD COLUMN IF NOT EXISTS warranty_provider text NULL,
  ADD COLUMN IF NOT EXISTS warranty_notes text NULL;
