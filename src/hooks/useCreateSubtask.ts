import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const DEFAULT_CATEGORY_ID = 'ecfc9834-8791-4199-9a2b-c4f49df4db9d';

interface CreateTaskFromSuggestionParams {
  suggestion: string;
  parentTitle: string;
  parentItemId: string;
  parentItemType: 'task' | 'idea' | 'reminder';
  categoryId?: string | null;
  title?: string;
  description?: string;
}

export function useCreateSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateTaskFromSuggestionParams) => {
      const title = params.title
        ? (params.title.length > 80 ? params.title.slice(0, 77) + '...' : params.title)
        : (params.suggestion.length > 80 ? params.suggestion.slice(0, 77) + '...' : params.suggestion);

      const description = params.description
        || `From: ${params.parentTitle}\n\nFull suggestion: ${params.suggestion}\n\nCreated by AI Enrichment`;

      const insertData: Record<string, any> = {
        title,
        description,
        status: 'Backlog',
        priority: 'Low',
        category_id: params.categoryId || DEFAULT_CATEGORY_ID,
      };

      const { data, error } = await (supabase
        .from('cos_tasks')
        .insert(insertData as any)
        .select()
        .single());

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: 'Task created',
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
