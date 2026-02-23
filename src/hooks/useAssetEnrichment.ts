import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AiEnrichmentRow } from './useAiEnrichments';

export function useAssetEnrichment(assetId: string | undefined) {
  return useQuery({
    queryKey: ['ai-enrichment-for-asset', assetId],
    enabled: !!assetId,
    queryFn: async (): Promise<AiEnrichmentRow | null> => {
      const { data, error } = await supabase
        .from('ai_enrichments')
        .select('*')
        .eq('item_type', 'asset')
        .eq('item_id', assetId!)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
      } as unknown as AiEnrichmentRow;
    },
  });
}
