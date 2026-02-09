import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format } from 'date-fns';

export type CalendarItem = {
  id: string;
  title: string;
  date: string;
  type: 'kanban' | 'maintenance';
  status: string;
  priority?: string;
  description?: string;
  assetName?: string;
  providerName?: string;
  recurrenceRule?: string;
};

export function useCalendarKanbanTasks() {
  return useQuery({
    queryKey: ['calendar-kanban-tasks'],
    queryFn: async (): Promise<CalendarItem[]> => {
      const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('cos_tasks')
        .select('id, title, description, status, priority, due_date, updated_at')
        .not('due_date', 'is', null);

      if (error) throw error;

      return (data ?? [])
        .filter((t) => {
          const isDone = t.status?.toLowerCase() === 'done';
          if (!isDone) return true;
          // Include done tasks completed in last 7 days
          const updatedDate = t.updated_at ? t.updated_at.split('T')[0] : null;
          return updatedDate && updatedDate >= sevenDaysAgo;
        })
        .map((t) => ({
          id: t.id,
          title: t.title,
          date: t.due_date!,
          type: 'kanban' as const,
          status: t.status ?? 'to-do',
          priority: t.priority ?? undefined,
          description: t.description ?? undefined,
        }));
    },
  });
}

export function useCalendarMaintenanceTasks() {
  return useQuery({
    queryKey: ['calendar-maintenance-tasks'],
    queryFn: async (): Promise<CalendarItem[]> => {
      const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('tasks')
        .select('id, name, status, next_due_date, recurrence_rule, notes, date_completed, assets(name), service_providers(name)')
        .not('next_due_date', 'is', null);

      if (error) throw error;

      return (data ?? [])
        .filter((t) => {
          const isCompleted = t.status === 'completed';
          if (!isCompleted) return true;
          return t.date_completed && t.date_completed >= sevenDaysAgo;
        })
        .map((t: any) => ({
          id: t.id,
          title: t.name,
          date: t.next_due_date!,
          type: 'maintenance' as const,
          status: t.status ?? 'pending',
          assetName: t.assets?.name ?? undefined,
          providerName: t.service_providers?.name ?? undefined,
          recurrenceRule: t.recurrence_rule ?? undefined,
          description: t.notes ?? undefined,
        }));
    },
  });
}

export function useCalendarTasks() {
  const kanban = useCalendarKanbanTasks();
  const maintenance = useCalendarMaintenanceTasks();

  const items: CalendarItem[] = [
    ...(kanban.data ?? []),
    ...(maintenance.data ?? []),
  ];

  return {
    items,
    isLoading: kanban.isLoading || maintenance.isLoading,
    error: kanban.error || maintenance.error,
  };
}
