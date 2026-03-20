import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

function toRecurrenceRule(freq: { interval: number; unit: string } | null): string | null {
  if (!freq) return null;
  const unitMap: Record<string, string> = { days: 'd', weeks: 'w', months: 'm', years: 'y' };
  return `${freq.interval}${unitMap[freq.unit] || 'm'}`;
}

export function useUpdateDirectTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, updates }: {
      taskId: string;
      updates: {
        name?: string;
        next_due_date?: string | null;
        recurrence_rule?: string | null;
        provider_id?: string | null;
      };
    }) => {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-maintenance-events'] });
      qc.invalidateQueries({ queryKey: ['calendar-maintenance-tasks'] });
      toast({ title: 'Task updated' });
    },
    onError: (e: Error) => {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    },
  });
}

export function useCompleteMaintenanceEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, assetId, taskId }: { name: string; assetId: string; taskId?: string }) => {
      const today = format(new Date(), 'yyyy-MM-dd');

      if (taskId) {
        // Complete an existing task in the tasks table
        const { error } = await supabase
          .from('tasks')
          .update({ status: 'completed', date_completed: today })
          .eq('id', taskId);
        if (error) throw error;
      } else {
        // Create a completion record for an AI-enrichment task
        const { error } = await supabase.from('tasks').insert({
          name,
          asset_id: assetId,
          status: 'completed',
          date_completed: today,
          notes: 'Completed via maintenance schedule',
        });
        if (error) throw error;
      }
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
    mutationFn: async ({ enrichmentId, suggestionIndex, taskId }: { enrichmentId: string; suggestionIndex: number; taskId?: string }) => {
      if (taskId) {
        // Delete directly from the tasks table
        const { error } = await supabase.from('tasks').delete().eq('id', taskId);
        if (error) throw error;
      } else {
        // Dismiss from ai_enrichments suggestions
        const { data, error: fetchErr } = await supabase
          .from('ai_enrichments')
          .select('suggestions')
          .eq('id', enrichmentId)
          .single();
        if (fetchErr) throw fetchErr;

        const suggestions = Array.isArray(data.suggestions) ? [...data.suggestions] : [];
        if (suggestionIndex < 0 || suggestionIndex >= suggestions.length) {
          throw new Error('Invalid suggestion index');
        }
        const item = suggestions[suggestionIndex] as Record<string, unknown>;
        suggestions[suggestionIndex] = { ...item, status: 'dismissed' };

        const { error: updateErr } = await supabase
          .from('ai_enrichments')
          .update({ suggestions: suggestions as any })
          .eq('id', enrichmentId);
        if (updateErr) throw updateErr;
      }
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
