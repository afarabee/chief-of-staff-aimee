import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAiExecutions(itemId: string | undefined) {
  return useQuery({
    queryKey: ['ai-executions', itemId],
    enabled: !!itemId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_executions')
        .select('*')
        .eq('item_id', itemId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
