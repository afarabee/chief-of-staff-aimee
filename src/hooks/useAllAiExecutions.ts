import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAllAiExecutions(itemTypeFilter?: string) {
  return useQuery({
    queryKey: ['ai-executions', 'all', itemTypeFilter],
    queryFn: async () => {
      let query = supabase
        .from('ai_executions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (itemTypeFilter && itemTypeFilter !== 'all') {
        query = query.eq('item_type', itemTypeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}
