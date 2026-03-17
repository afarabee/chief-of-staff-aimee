CREATE TABLE public.command_center_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_order text[] NOT NULL DEFAULT ARRAY['briefing','weather','calendar','ideaSpotlight','news','podcasts'],
  hidden_widgets text[] NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.command_center_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to command_center_config" ON public.command_center_config FOR ALL TO public USING (true) WITH CHECK (true);

INSERT INTO public.command_center_config (widget_order) VALUES (ARRAY['briefing','weather','calendar','ideaSpotlight','news','podcasts']);