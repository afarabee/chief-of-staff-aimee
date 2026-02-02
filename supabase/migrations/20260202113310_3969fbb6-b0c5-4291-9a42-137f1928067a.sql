-- Create cos_categories table
CREATE TABLE public.cos_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cos_categories ENABLE ROW LEVEL SECURITY;

-- Allow all access (no auth)
CREATE POLICY "Allow all access to cos_categories" 
ON public.cos_categories 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Add category_id to cos_tasks
ALTER TABLE public.cos_tasks 
ADD COLUMN category_id UUID REFERENCES public.cos_categories(id) ON DELETE SET NULL;

-- Add category_id to cos_ideas
ALTER TABLE public.cos_ideas 
ADD COLUMN category_id UUID REFERENCES public.cos_categories(id) ON DELETE SET NULL;

-- Insert default categories
INSERT INTO public.cos_categories (name) VALUES 
  ('🌐 Website'),
  ('✍️ Blog'),
  ('🤖 AI Project'),
  ('🏠 Home'),
  ('💰 Finances'),
  ('🔬 Research'),
  ('💬 Prompts'),
  ('💼 Work'),
  ('🔎 Job Search'),
  ('🎁 Gifts'),
  ('🐾 Pets'),
  ('👨‍👩‍👧 Family'),
  ('✈️ Travel'),
  ('📌 Other');