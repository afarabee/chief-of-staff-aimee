import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface EnrichItemParams {
  item_type: 'task' | 'idea' | 'reminder';
  item: Record<string, any>;
}

export function useEnrichItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: EnrichItemParams) => {
      const { data, error } = await supabase.functions.invoke('enrich-item', {
        body: params,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data.suggestions as string;
    },
    onSuccess: (_data, variables) => {
      if (variables.item_type === 'task') {
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      } else if (variables.item_type === 'idea') {
        queryClient.invalidateQueries({ queryKey: ['ideas'] });
      } else if (variables.item_type === 'reminder') {
        queryClient.invalidateQueries({ queryKey: ['maintenance-tasks'] });
        queryClient.invalidateQueries({ queryKey: ['kanban-maintenance'] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Enrichment failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
