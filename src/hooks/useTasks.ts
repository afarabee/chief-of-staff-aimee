import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Task, TaskStatus, TaskPriority } from '@/types';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

type DbTask = Tables<'cos_tasks'>;

// Map database status values to app status values
function normalizeStatus(dbStatus: string | null): TaskStatus {
  if (!dbStatus) return 'to-do';
  const lower = dbStatus.toLowerCase().replace(/\s+/g, '-');
  const validStatuses: TaskStatus[] = ['backlog', 'to-do', 'in-progress', 'blocked', 'done'];
  return validStatuses.includes(lower as TaskStatus) ? (lower as TaskStatus) : 'to-do';
}

// Map database priority values to app priority values
function normalizePriority(dbPriority: string | null): TaskPriority {
  if (!dbPriority) return 'medium';
  const lower = dbPriority.toLowerCase();
  const validPriorities: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];
  return validPriorities.includes(lower as TaskPriority) ? (lower as TaskPriority) : 'medium';
}

// Convert database record to app type
function dbTaskToTask(dbTask: DbTask): Task {
  return {
    id: dbTask.id,
    title: dbTask.title,
    description: dbTask.description || '',
    dueDate: dbTask.due_date ? new Date(dbTask.due_date) : null,
    status: normalizeStatus(dbTask.status),
    priority: normalizePriority(dbTask.priority),
    createdAt: new Date(dbTask.created_at || Date.now()),
    completedAt: dbTask.status?.toLowerCase() === 'done' && dbTask.updated_at 
      ? new Date(dbTask.updated_at) 
      : null,
  };
}

// Convert app type to database format for insert
function taskToDbInsert(task: Omit<Task, 'id' | 'createdAt' | 'completedAt'>, userId: string): TablesInsert<'cos_tasks'> {
  return {
    title: task.title,
    description: task.description || null,
    due_date: task.dueDate ? task.dueDate.toISOString().split('T')[0] : null,
    status: task.status,
    priority: task.priority,
    user_id: userId,
  };
}

// Convert partial task to database format for update
function taskToDbUpdate(updates: Partial<Task>): TablesUpdate<'cos_tasks'> {
  const dbUpdate: TablesUpdate<'cos_tasks'> = {};
  
  if (updates.title !== undefined) dbUpdate.title = updates.title;
  if (updates.description !== undefined) dbUpdate.description = updates.description || null;
  if (updates.dueDate !== undefined) {
    dbUpdate.due_date = updates.dueDate ? updates.dueDate.toISOString().split('T')[0] : null;
  }
  if (updates.status !== undefined) dbUpdate.status = updates.status;
  if (updates.priority !== undefined) dbUpdate.priority = updates.priority;
  
  return dbUpdate;
}

// Fetch all tasks for current user
export function useTasks() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['tasks', user?.id],
    queryFn: async (): Promise<Task[]> => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('cos_tasks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(dbTaskToTask);
    },
    enabled: !!user,
  });
}

// Create a new task
export function useCreateTask() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (task: Omit<Task, 'id' | 'createdAt' | 'completedAt'>) => {
      if (!user) throw new Error('Must be logged in to create tasks');
      
      const { data, error } = await supabase
        .from('cos_tasks')
        .insert(taskToDbInsert(task, user.id))
        .select()
        .single();
      
      if (error) throw error;
      return dbTaskToTask(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({ title: 'Task created', description: 'Your task has been saved.' });
    },
    onError: (error) => {
      console.error('Failed to create task:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to create task. Please try again.',
        variant: 'destructive'
      });
    },
  });
}

// Update an existing task
export function useUpdateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Task> }) => {
      const { data, error } = await supabase
        .from('cos_tasks')
        .update(taskToDbUpdate(updates))
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return dbTaskToTask(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error) => {
      console.error('Failed to update task:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to update task. Please try again.',
        variant: 'destructive'
      });
    },
  });
}

// Delete a task
export function useDeleteTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cos_tasks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({ title: 'Task deleted', description: 'The task has been removed.' });
    },
    onError: (error) => {
      console.error('Failed to delete task:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to delete task. Please try again.',
        variant: 'destructive'
      });
    },
  });
}
