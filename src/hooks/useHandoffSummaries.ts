import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HandoffSummary {
  session_date: string;
  project_name: string;
  tools: string[];
  completed: string[];
  in_progress: string[];
  next_steps: string[];
  resume_command: string | null;
}

async function fetchHandoffSummaries(): Promise<HandoffSummary[]> {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const cutoff = threeDaysAgo.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('handoff_summaries')
    .select('session_date, project_name, tools, completed, in_progress, next_steps, resume_command')
    .gte('session_date', cutoff)
    .order('session_date', { ascending: false });

  if (error) throw error;
  return (data as HandoffSummary[]) ?? [];
}

export function useHandoffSummaries() {
  return useQuery({
    queryKey: ['handoff-summaries'],
    queryFn: fetchHandoffSummaries,
    staleTime: 10 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    retry: 1,
  });
}
