import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Category } from '@/types';
import { toast } from '@/hooks/use-toast';

type DbCategory = {
  id: string;
  name: string;
  icon: string | null;
  created_at: string | null;
};

// Convert database record to app type
function dbCategoryToCategory(dbCategory: DbCategory): Category {
  return {
    id: dbCategory.id,
    name: dbCategory.name,
    icon: dbCategory.icon,
    createdAt: new Date(dbCategory.created_at || Date.now()),
  };
}

// Fetch all categories
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from('cos_categories')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return (data || []).map(dbCategoryToCategory);
    },
  });
}

// Create a new category
export function useCreateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ name, icon }: { name: string; icon?: string | null }) => {
      const { data, error } = await supabase
        .from('cos_categories')
        .insert({ name, icon: icon || null })
        .select()
        .single();
      
      if (error) throw error;
      return dbCategoryToCategory(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({ title: 'Category created' });
    },
    onError: (error) => {
      console.error('Failed to create category:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to create category. Please try again.',
        variant: 'destructive'
      });
    },
  });
}

// Update an existing category
export function useUpdateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, name, icon }: { id: string; name: string; icon?: string | null }) => {
      const { data, error } = await supabase
        .from('cos_categories')
        .update({ name, icon: icon ?? null })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return dbCategoryToCategory(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
      toast({ title: 'Category updated' });
    },
    onError: (error) => {
      console.error('Failed to update category:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to update category. Please try again.',
        variant: 'destructive'
      });
    },
  });
}

// Delete a category
export function useDeleteCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cos_categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
      toast({ title: 'Category deleted', description: 'The category has been removed.' });
    },
    onError: (error) => {
      console.error('Failed to delete category:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to delete category. Please try again.',
        variant: 'destructive'
      });
    },
  });
}
