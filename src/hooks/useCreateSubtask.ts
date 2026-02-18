import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CreateSubtaskParams {
  suggestion: string;
  parentTitle: string;
  categoryId?: string | null;
}

export function useCreateSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateSubtaskParams) => {
      const title = params.suggestion.length > 80
        ? params.suggestion.slice(0, 77) + '...'
        : params.suggestion;

      const description = `Subtask created from AI suggestion for: ${params.parentTitle}\n\nFull suggestion: ${params.suggestion}\n\nCreated by AI Enrichment`;

      const { data, error } = await supabase
        .from('cos_tasks')
        .insert({
          title,
          description,
          status: 'Backlog',
          priority: 'Low',
          category_id: params.categoryId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: 'Subtask created',
        description: 'A new task has been created from the suggestion.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create subtask',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
