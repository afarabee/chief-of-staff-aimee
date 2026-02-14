import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Asset, AssetCategory } from '@/types/assets';

function mapRow(row: any): Asset {
  const cat = row.categories;
  return {
    id: row.id,
    name: row.name,
    categoryId: row.category_id,
    categoryName: cat?.name ?? undefined,
    categoryIcon: cat?.icon ?? null,
    categoryColor: cat?.color ?? null,
    description: row.description,
    purchaseDate: row.purchase_date,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    showOnKanban: row.show_on_kanban ?? false,
  };
}

export function useAssets() {
  return useQuery({
    queryKey: ['assets'],
    queryFn: async (): Promise<Asset[]> => {
      const { data, error } = await supabase
        .from('assets')
        .select('*, categories(id, name, icon, color)')
        .order('name');
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
  });
}

export function useAssetCategories() {
  return useQuery({
    queryKey: ['asset-categories'],
    queryFn: async (): Promise<AssetCategory[]> => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, icon, color')
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (asset: { name: string; category_id?: string | null; description?: string | null; purchase_date?: string | null; notes?: string | null }) => {
      const { data, error } = await supabase.from('assets').insert(asset).select('id').single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] });
      toast({ title: 'Asset added' });
    },
    onError: (e: Error) => {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    },
  });
}

export function useUpdateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; category_id?: string | null; description?: string | null; purchase_date?: string | null; notes?: string | null; show_on_kanban?: boolean }) => {
      const { error } = await supabase.from('assets').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] });
      toast({ title: 'Asset updated' });
    },
    onError: (e: Error) => {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    },
  });
}

export function useDeleteAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('assets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] });
      toast({ title: 'Asset deleted' });
    },
    onError: (e: Error) => {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    },
  });
}
