-- Drop existing restrictive RLS policies on cos_tasks
DROP POLICY IF EXISTS "Users can delete own tasks" ON public.cos_tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON public.cos_tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON public.cos_tasks;
DROP POLICY IF EXISTS "Users can view own tasks" ON public.cos_tasks;

-- Drop existing restrictive RLS policies on cos_ideas
DROP POLICY IF EXISTS "Users can delete own ideas" ON public.cos_ideas;
DROP POLICY IF EXISTS "Users can insert own ideas" ON public.cos_ideas;
DROP POLICY IF EXISTS "Users can update own ideas" ON public.cos_ideas;
DROP POLICY IF EXISTS "Users can view own ideas" ON public.cos_ideas;

-- Create permissive policies for cos_tasks (single-user personal app)
CREATE POLICY "Allow all access to cos_tasks"
ON public.cos_tasks
FOR ALL
USING (true)
WITH CHECK (true);

-- Create permissive policies for cos_ideas (single-user personal app)
CREATE POLICY "Allow all access to cos_ideas"
ON public.cos_ideas
FOR ALL
USING (true)
WITH CHECK (true);