import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface NewsArticle {
  title: string;
  source: string;
  snippet: string;
}

async function fetchNews(): Promise<NewsArticle[]> {
  const { data, error } = await supabase.functions.invoke('ai-news');
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data?.articles || [];
}

export function useAiNews() {
  return useQuery({
    queryKey: ['ai-news'],
    queryFn: fetchNews,
    staleTime: 30 * 60 * 1000,
    refetchInterval: 30 * 60 * 1000,
    retry: 1,
  });
}
