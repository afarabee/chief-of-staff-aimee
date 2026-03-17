CREATE TABLE public.podcast_feeds (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  rss_url text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.podcast_feeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to podcast_feeds" ON public.podcast_feeds
  FOR ALL TO public USING (true) WITH CHECK (true);