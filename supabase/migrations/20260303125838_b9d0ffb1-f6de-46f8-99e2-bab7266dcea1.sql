
CREATE TABLE public.asset_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  display_name text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.asset_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to asset_attachments" ON public.asset_attachments FOR ALL USING (true) WITH CHECK (true);
