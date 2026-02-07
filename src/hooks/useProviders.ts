import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Provider } from '@/types/providers';

function mapRow(row: any): Provider {
  const cat = row.categories;
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    website: row.website,
    notes: row.notes,
    categoryId: row.category_id,
    categoryName: cat?.name ?? undefined,
    categoryIcon: cat?.icon ?? null,
    categoryColor: cat?.color ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useProviders() {
  return useQuery({
    queryKey: ['providers'],
    queryFn: async (): Promise<Provider[]> => {
      const { data, error } = await supabase
        .from('service_providers')
        .select('*, categories(id, name, icon, color)')
        .order('name');
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
  });
}

export function useCreateProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (provider: { name: string; category_id?: string | null; phone?: string | null; email?: string | null; address?: string | null; website?: string | null; notes?: string | null }) => {
      const { error } = await supabase.from('service_providers').insert(provider);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['providers'] });
      toast({ title: 'Provider added' });
    },
    onError: (e: Error) => {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    },
  });
}

export function useUpdateProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; category_id?: string | null; phone?: string | null; email?: string | null; address?: string | null; website?: string | null; notes?: string | null }) => {
      const { error } = await supabase.from('service_providers').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['providers'] });
      toast({ title: 'Provider updated' });
    },
    onError: (e: Error) => {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    },
  });
}

export function useDeleteProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('service_providers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['providers'] });
      toast({ title: 'Provider deleted' });
    },
    onError: (e: Error) => {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    },
  });
}
