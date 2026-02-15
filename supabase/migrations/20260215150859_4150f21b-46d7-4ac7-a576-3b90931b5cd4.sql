CREATE TABLE asset_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(asset_id, provider_id)
);

ALTER TABLE asset_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to asset_providers" ON asset_providers
  FOR ALL USING (true) WITH CHECK (true);