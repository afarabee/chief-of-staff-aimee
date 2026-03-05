import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BulkAcceptParams {
  enrichmentId: string;
  indexes: number[];
}

export function useBulkAcceptSuggestions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ enrichmentId, indexes }: BulkAcceptParams) => {
      const { data: row, error: readErr } = await supabase
        .from('ai_enrichments')
        .select('suggestions')
        .eq('id', enrichmentId)
        .single();

      if (readErr) throw readErr;

      const suggestions = Array.isArray(row.suggestions) ? [...(row.suggestions as any[])] : [];
      for (const idx of indexes) {
        if (suggestions[idx]) {
          suggestions[idx] = { ...suggestions[idx], status: 'accepted' };
        }
      }

      const { error: writeErr } = await supabase
        .from('ai_enrichments')
        .update({ suggestions: suggestions as any })
        .eq('id', enrichmentId);

      if (writeErr) throw writeErr;

      return indexes.length;
    },
    onSuccess: (count) => {
      toast({ title: `Accepted ${count} maintenance task${count === 1 ? '' : 's'}` });
      queryClient.invalidateQueries({ queryKey: ['ai-enrichment-for-asset'] });
      queryClient.invalidateQueries({ queryKey: ['ai-enrichments'] });
      queryClient.invalidateQueries({ queryKey: ['all-maintenance-events'] });
    },
    onError: (err: Error) => {
      toast({
        title: 'Failed to accept tasks',
        description: err.message,
        variant: 'destructive',
      });
    },
  });
}
