import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SubtaskRow {
  id: string;
  title: string;
  status: string | null;
}

export function useSubtasks(parentTaskId: string | undefined) {
  return useQuery({
    queryKey: ['subtasks', parentTaskId],
    queryFn: async (): Promise<SubtaskRow[]> => {
      const { data, error } = await supabase
        .from('cos_tasks')
        .select('id, title, status')
        .eq('parent_task_id', parentTaskId!)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!parentTaskId,
  });
}
