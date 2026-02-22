import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UpdateParams {
  enrichmentId: string;
  suggestionIndex: number;
  updates: Record<string, any>;
}

export function useUpdateEnrichmentSuggestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ enrichmentId, suggestionIndex, updates }: UpdateParams) => {
      // Read current
      const { data: row, error: readErr } = await supabase
        .from('ai_enrichments')
        .select('suggestions')
        .eq('id', enrichmentId)
        .single();

      if (readErr) throw readErr;

      const suggestions = Array.isArray(row.suggestions) ? [...(row.suggestions as any[])] : [];
      if (suggestions[suggestionIndex]) {
        suggestions[suggestionIndex] = { ...suggestions[suggestionIndex], ...updates };
      }

      const { error: writeErr } = await supabase
        .from('ai_enrichments')
        .update({ suggestions: suggestions as any })
        .eq('id', enrichmentId);

      if (writeErr) throw writeErr;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ai-enrichment', variables.enrichmentId] });
      queryClient.invalidateQueries({ queryKey: ['ai-enrichments'] });
    },
  });
}
