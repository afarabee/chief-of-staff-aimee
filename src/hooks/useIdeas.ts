import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Idea, IdeaStatus } from '@/types';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from '@/hooks/use-toast';

type DbIdea = Tables<'cos_ideas'>;

// Map database status values to app status values
function normalizeStatus(dbStatus: string | null): IdeaStatus {
  if (!dbStatus) return 'new';
  const lower = dbStatus.toLowerCase().replace(/\s+/g, '-');
  const validStatuses: IdeaStatus[] = ['new', 'in-progress', 'parked', 'done'];
  return validStatuses.includes(lower as IdeaStatus) ? (lower as IdeaStatus) : 'new';
}

// Convert database record to app type
function dbIdeaToIdea(dbIdea: DbIdea): Idea {
  return {
    id: dbIdea.id,
    title: dbIdea.title,
    description: dbIdea.description || '',
    status: normalizeStatus(dbIdea.status),
    createdAt: new Date(dbIdea.created_at || Date.now()),
  };
}

// Convert app type to database format for insert
function ideaToDbInsert(idea: Omit<Idea, 'id' | 'createdAt'>): TablesInsert<'cos_ideas'> {
  return {
    title: idea.title,
    description: idea.description || null,
    status: idea.status,
  };
}

// Convert partial idea to database format for update
function ideaToDbUpdate(updates: Partial<Idea>): TablesUpdate<'cos_ideas'> {
  const dbUpdate: TablesUpdate<'cos_ideas'> = {};
  
  if (updates.title !== undefined) dbUpdate.title = updates.title;
  if (updates.description !== undefined) dbUpdate.description = updates.description || null;
  if (updates.status !== undefined) dbUpdate.status = updates.status;
  
  return dbUpdate;
}

// Fetch all ideas
export function useIdeas() {
  return useQuery({
    queryKey: ['ideas'],
    queryFn: async (): Promise<Idea[]> => {
      const { data, error } = await supabase
        .from('cos_ideas')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(dbIdeaToIdea);
    },
  });
}

// Create a new idea
export function useCreateIdea() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (idea: Omit<Idea, 'id' | 'createdAt'>) => {
      const { data, error } = await supabase
        .from('cos_ideas')
        .insert(ideaToDbInsert(idea))
        .select()
        .single();
      
      if (error) throw error;
      return dbIdeaToIdea(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
      toast({ title: 'Idea captured', description: 'Your idea has been saved.' });
    },
    onError: (error) => {
      console.error('Failed to create idea:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to create idea. Please try again.',
        variant: 'destructive'
      });
    },
  });
}

// Update an existing idea
export function useUpdateIdea() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Idea> }) => {
      const { data, error } = await supabase
        .from('cos_ideas')
        .update(ideaToDbUpdate(updates))
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return dbIdeaToIdea(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
    },
    onError: (error) => {
      console.error('Failed to update idea:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to update idea. Please try again.',
        variant: 'destructive'
      });
    },
  });
}

// Delete an idea
export function useDeleteIdea() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cos_ideas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
      toast({ title: 'Idea deleted', description: 'The idea has been removed.' });
    },
    onError: (error) => {
      console.error('Failed to delete idea:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to delete idea. Please try again.',
        variant: 'destructive'
      });
    },
  });
}
