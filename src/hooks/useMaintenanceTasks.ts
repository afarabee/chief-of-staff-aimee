import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

/**
 * Mark a maintenance event as completed.
 * Inserts a completion record into the `tasks` table.
 */
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
