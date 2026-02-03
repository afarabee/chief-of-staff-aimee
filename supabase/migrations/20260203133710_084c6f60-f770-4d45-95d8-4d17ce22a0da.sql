-- Create the attachments bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', true);

-- Allow public read access
CREATE POLICY "Public read access for attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'attachments');

-- Allow insert access (anyone can upload since no auth is implemented)
CREATE POLICY "Allow insert for attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'attachments');

-- Allow delete access
CREATE POLICY "Allow delete for attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'attachments');

-- Add image_url column to both tables
ALTER TABLE cos_tasks ADD COLUMN image_url TEXT;
ALTER TABLE cos_ideas ADD COLUMN image_url TEXT;