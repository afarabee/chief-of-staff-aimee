import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const DEFAULT_CATEGORY_ID = 'ecfc9834-8791-4199-9a2b-c4f49df4db9d';

interface CreateSubtaskParams {
  suggestion: string;
  parentTitle: string;
  parentItemId: string;
  parentItemType: 'task' | 'idea' | 'reminder';
  categoryId?: string | null;
}

export function useCreateSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateSubtaskParams) => {
      const title = params.suggestion.length > 80
        ? params.suggestion.slice(0, 77) + '...'
        : params.suggestion;

      const description = `Subtask of: ${params.parentTitle}\n\nFull suggestion: ${params.suggestion}\n\nCreated by AI Enrichment`;

      const insertData: Record<string, any> = {
        title,
        description,
        status: 'Backlog',
        priority: 'Low',
        category_id: params.categoryId || DEFAULT_CATEGORY_ID,
      };

      if (params.parentItemType === 'task') {
        insertData.parent_task_id = params.parentItemId;
      }

      const { data, error } = await (supabase
        .from('cos_tasks')
        .insert(insertData as any)
        .select()
        .single());

      if (error) throw error;
      return { data, parentItemId: params.parentItemId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['subtasks', result.parentItemId] });
      toast({
        title: 'Subtask created',
        description: 'A new task has been created from the suggestion.',
      });
    },
    onError: (error: Error) => {
      console.error('Failed to create subtask:', error);
      toast({
        title: 'Failed to create subtask',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
