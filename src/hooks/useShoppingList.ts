import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingItem } from '@/types';
import { toast } from '@/hooks/use-toast';

interface DbShoppingItem {
  id: string;
  name: string;
  checked: boolean;
  created_at: string;
}

function dbToApp(row: DbShoppingItem): ShoppingItem {
  return {
    id: row.id,
    name: row.name,
    checked: row.checked,
    createdAt: new Date(row.created_at),
  };
}

const QUERY_KEY = ['shopping-list'];

export function useShoppingList() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<ShoppingItem[]> => {
      const { data, error } = await (supabase as any)
        .from('shopping_list')
        .select('*')
        .order('checked', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(dbToApp);
    },
  });
}

export function useAddShoppingItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await (supabase as any)
        .from('shopping_list')
        .insert({ name })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to add item', description: err.message, variant: 'destructive' });
    },
  });
}

export function useToggleShoppingItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, checked }: { id: string; checked: boolean }) => {
      const { error } = await (supabase as any)
        .from('shopping_list')
        .update({ checked })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteShoppingItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('shopping_list')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useClearCheckedItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any)
        .from('shopping_list')
        .delete()
        .eq('checked', true);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast({ title: 'Cleared checked items' });
    },
  });
}
