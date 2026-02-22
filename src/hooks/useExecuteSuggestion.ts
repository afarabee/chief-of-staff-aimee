import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ExecuteSuggestionParams {
  suggestion: string;
  item_type: 'task' | 'idea' | 'reminder' | 'asset';
  item_title: string;
  item_description: string;
  item_id: string;
  suggestion_index: number;
}

export function useExecuteSuggestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: ExecuteSuggestionParams) => {
      const { data, error } = await supabase.functions.invoke('execute-suggestion', {
        body: params,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data.result as string;
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
      queryClient.invalidateQueries({ queryKey: ['ai-executions', variables.item_id] });
      queryClient.invalidateQueries({ queryKey: ['ai-executions', 'all'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Execution failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
