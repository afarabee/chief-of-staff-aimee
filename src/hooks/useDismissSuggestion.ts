import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface DismissParams {
  itemType: 'task' | 'idea' | 'reminder';
  itemId: string;
  suggestionIndex: number;
}

function getTable(itemType: string) {
  if (itemType === 'task') return 'cos_tasks';
  if (itemType === 'idea') return 'cos_ideas';
  return 'tasks';
}

export function useDismissSuggestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemType, itemId, suggestionIndex }: DismissParams) => {
      const table = getTable(itemType) as 'cos_tasks' | 'cos_ideas' | 'tasks';
      const { data: row, error: readErr } = await supabase
        .from(table)
        .select('ai_suggestions')
        .eq('id', itemId)
        .single();

      if (readErr) throw readErr;
      if (!row?.ai_suggestions) return;

      const suggestions = JSON.parse(row.ai_suggestions);
      if (Array.isArray(suggestions) && suggestions[suggestionIndex]) {
        suggestions[suggestionIndex].dismissed = true;
        const { error: writeErr } = await supabase
          .from(table)
          .update({ ai_suggestions: JSON.stringify(suggestions) })
          .eq('id', itemId);
        if (writeErr) throw writeErr;
      }
    },
    onSuccess: (_, variables) => {
      if (variables.itemType === 'task') {
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      } else if (variables.itemType === 'idea') {
        queryClient.invalidateQueries({ queryKey: ['ideas'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['maintenance-tasks'] });
        queryClient.invalidateQueries({ queryKey: ['kanban-maintenance'] });
      }
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to dismiss', description: error.message, variant: 'destructive' });
    },
  });
}
