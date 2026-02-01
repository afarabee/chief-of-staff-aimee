-- Add user_id column to cos_tasks table
ALTER TABLE public.cos_tasks ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to cos_ideas table  
ALTER TABLE public.cos_ideas ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop old permissive policies on cos_tasks
DROP POLICY IF EXISTS "Allow all access to cos_tasks" ON public.cos_tasks;

-- Create user-scoped RLS policies for cos_tasks
CREATE POLICY "Users can view own tasks"
  ON public.cos_tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON public.cos_tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON public.cos_tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON public.cos_tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Drop old permissive policies on cos_ideas
DROP POLICY IF EXISTS "Allow all access to cos_ideas" ON public.cos_ideas;

-- Create user-scoped RLS policies for cos_ideas
CREATE POLICY "Users can view own ideas"
  ON public.cos_ideas FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ideas"
  ON public.cos_ideas FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ideas"
  ON public.cos_ideas FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own ideas"
  ON public.cos_ideas FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);