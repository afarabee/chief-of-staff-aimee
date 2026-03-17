import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BriefingSuggestion {
  text: string;
  type: 'reschedule' | 'focus' | 'unblock' | 'idea' | 'general';
}

export interface IdeaSpotlight {
  title: string;
  reason: string;
  steps: string[];
}

export interface DailyBriefing {
  greeting: string;
  summary: string;
  suggestions: BriefingSuggestion[];
  ideaSpotlight: IdeaSpotlight;
}

async function fetchBriefing(): Promise<DailyBriefing> {
  const { data, error } = await supabase.functions.invoke('daily-briefing');
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as DailyBriefing;
}

export function useDailyBriefing() {
  return useQuery({
    queryKey: ['daily-briefing'],
    queryFn: fetchBriefing,
    staleTime: 15 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
    retry: 1,
  });
}
