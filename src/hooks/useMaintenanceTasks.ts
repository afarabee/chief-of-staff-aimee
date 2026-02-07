import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { addDays, addMonths, addYears, format } from 'date-fns';
import type { MaintenanceTask } from '@/types/maintenance';

function mapRow(row: any): MaintenanceTask {
  const asset = row.assets;
  const provider = row.service_providers;
  return {
    id: row.id,
    name: row.name,
    assetId: row.asset_id,
    assetName: asset?.name ?? undefined,
    providerId: row.provider_id,
    providerName: provider?.name ?? undefined,
    dateCompleted: row.date_completed,
    nextDueDate: row.next_due_date,
    cost: row.cost,
    notes: row.notes,
    attachmentUrl: row.attachment_url,
    recurrenceRule: row.recurrence_rule,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SELECT = '*, assets(id, name, show_on_kanban), service_providers(id, name)';

const ALL_KEYS = [['maintenance-tasks'], ['kanban-maintenance']];

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  ALL_KEYS.forEach((k) => qc.invalidateQueries({ queryKey: k }));
  // Also invalidate any per-asset keys
  qc.invalidateQueries({ queryKey: ['tasks', 'asset'] });
}

export function useMaintenanceTasks() {
  return useQuery({
    queryKey: ['maintenance-tasks'],
    queryFn: async (): Promise<MaintenanceTask[]> => {
      const { data, error } = await supabase
        .from('tasks')
        .select(SELECT)
        .order('next_due_date', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
  });
}

export function useAssetMaintenanceTasks(assetId: string | undefined) {
  return useQuery({
    queryKey: ['tasks', 'asset', assetId],
    enabled: !!assetId,
    queryFn: async (): Promise<MaintenanceTask[]> => {
      const { data, error } = await supabase
        .from('tasks')
        .select(SELECT)
        .eq('asset_id', assetId!)
        .order('next_due_date', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
  });
}

export function useCreateMaintenanceTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (task: {
      name: string;
      asset_id?: string | null;
      provider_id?: string | null;
      next_due_date?: string | null;
      recurrence_rule?: string | null;
      status?: string | null;
      cost?: number | null;
      date_completed?: string | null;
      notes?: string | null;
      attachment_url?: string | null;
    }) => {
      const { error } = await supabase.from('tasks').insert(task);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll(qc);
      toast({ title: 'Task added' });
    },
    onError: (e: Error) => {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    },
  });
}

export function useUpdateMaintenanceTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string;
      name?: string;
      asset_id?: string | null;
      provider_id?: string | null;
      next_due_date?: string | null;
      recurrence_rule?: string | null;
      status?: string | null;
      cost?: number | null;
      date_completed?: string | null;
      notes?: string | null;
      attachment_url?: string | null;
    }) => {
      const { error } = await supabase.from('tasks').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll(qc);
      toast({ title: 'Task updated' });
    },
    onError: (e: Error) => {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    },
  });
}

export function useDeleteMaintenanceTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll(qc);
      toast({ title: 'Task deleted' });
    },
    onError: (e: Error) => {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    },
  });
}

function calcNextDueDate(rule: string): Date {
  const today = new Date();
  const match = rule.match(/^(\d+)([dmy])$/);
  if (!match) return addDays(today, 30);
  const n = parseInt(match[1], 10);
  const unit = match[2];
  if (unit === 'd') return addDays(today, n);
  if (unit === 'm') return addMonths(today, n);
  if (unit === 'y') return addYears(today, n);
  return addDays(today, 30);
}

export function useCompleteMaintenanceTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (task: MaintenanceTask) => {
      const today = format(new Date(), 'yyyy-MM-dd');
      // Mark current task as completed
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'completed', date_completed: today })
        .eq('id', task.id);
      if (error) throw error;

      // If recurring, create next occurrence
      if (task.recurrenceRule) {
        const nextDate = calcNextDueDate(task.recurrenceRule);
        const { error: insertError } = await supabase.from('tasks').insert({
          name: task.name,
          asset_id: task.assetId,
          provider_id: task.providerId,
          notes: task.notes,
          recurrence_rule: task.recurrenceRule,
          status: 'pending',
          next_due_date: format(nextDate, 'yyyy-MM-dd'),
        });
        if (insertError) throw insertError;
        return format(nextDate, 'MMM d, yyyy');
      }
      return null;
    },
    onSuccess: (nextDateStr) => {
      invalidateAll(qc);
      if (nextDateStr) {
        toast({ title: `Task completed — next occurrence scheduled for ${nextDateStr}` });
      } else {
        toast({ title: 'Task completed' });
      }
    },
    onError: (e: Error) => {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    },
  });
}

export function useKanbanMaintenanceTasks() {
  return useQuery({
    queryKey: ['kanban-maintenance'],
    queryFn: async (): Promise<MaintenanceTask[]> => {
      const { data, error } = await supabase
        .from('tasks')
        .select(SELECT)
        .in('status', ['pending', 'needs_attention'])
        .order('next_due_date', { ascending: true, nullsFirst: false });
      if (error) throw error;
      // Filter to only tasks whose asset has show_on_kanban = true
      return (data ?? [])
        .filter((row: any) => row.assets?.show_on_kanban === true)
        .map(mapRow);
    },
  });
}
