import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export function useCompleteMaintenanceEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, assetId }: { name: string; assetId: string }) => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { error } = await supabase.from('tasks').insert({
        name,
        asset_id: assetId,
        status: 'completed',
        date_completed: today,
        notes: 'Completed via maintenance schedule',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance-completions'] });
      qc.invalidateQueries({ queryKey: ['all-maintenance-events'] });
      qc.invalidateQueries({ queryKey: ['calendar-maintenance-tasks'] });
      toast({ title: 'Maintenance completed' });
    },
    onError: (e: Error) => {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    },
  });
}

export function useDeleteMaintenanceEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ enrichmentId, suggestionIndex }: { enrichmentId: string; suggestionIndex: number }) => {
      const { data, error: fetchErr } = await supabase
        .from('ai_enrichments')
        .select('suggestions')
        .eq('id', enrichmentId)
        .single();
      if (fetchErr) throw fetchErr;

      const suggestions = Array.isArray(data.suggestions) ? [...data.suggestions] as Record<string, unknown>[] : [];
      if (suggestionIndex < 0 || suggestionIndex >= suggestions.length) {
        throw new Error('Invalid suggestion index');
      }
      suggestions[suggestionIndex] = { ...suggestions[suggestionIndex], status: 'dismissed' };

      const { error: updateErr } = await supabase
        .from('ai_enrichments')
        .update({ suggestions })
        .eq('id', enrichmentId);
      if (updateErr) throw updateErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-maintenance-events'] });
      qc.invalidateQueries({ queryKey: ['ai-enrichment-for-asset'] });
      qc.invalidateQueries({ queryKey: ['ai-enrichments'] });
      qc.invalidateQueries({ queryKey: ['calendar-maintenance-tasks'] });
      toast({ title: 'Maintenance task removed' });
    },
    onError: (e: Error) => {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    },
  });
}
