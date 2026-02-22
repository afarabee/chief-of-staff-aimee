import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AiEnrichmentSuggestion {
  suggestion: string;
  status: 'pending' | 'executed' | 'dismissed' | 'accepted';
  result: string | null;
  frequency?: string;
  recommended_due_date?: string;
}

export interface AiEnrichmentRow {
  id: string;
  item_type: string;
  item_id: string;
  item_title: string;
  suggestions: AiEnrichmentSuggestion[];
  created_at: string | null;
}

export function useAiEnrichments(filter?: string) {
  return useQuery({
    queryKey: ['ai-enrichments', filter || 'all'],
    queryFn: async (): Promise<AiEnrichmentRow[]> => {
      let query = supabase
        .from('ai_enrichments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (filter && filter !== 'all') {
        query = query.eq('item_type', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map((row) => ({
        ...row,
        suggestions: Array.isArray(row.suggestions) ? row.suggestions : [],
      })) as unknown as AiEnrichmentRow[];
    },
  });
}
