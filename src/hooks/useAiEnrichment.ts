import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AiEnrichmentRow } from './useAiEnrichments';

export function useAiEnrichment(id: string | undefined) {
  return useQuery({
    queryKey: ['ai-enrichment', id],
    enabled: !!id,
    queryFn: async (): Promise<AiEnrichmentRow> => {
      const { data, error } = await supabase
        .from('ai_enrichments')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return {
        ...data,
        suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
      } as unknown as AiEnrichmentRow;
    },
  });
}
