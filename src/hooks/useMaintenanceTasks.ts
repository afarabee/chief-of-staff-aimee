import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { addDays, addMonths, addYears, format, parseISO, differenceInDays } from 'date-fns';
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

const ALL_KEYS = [['maintenance-tasks'], ['kanban-maintenance'], ['calendar-maintenance-tasks']];

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  ALL_KEYS.forEach((k) => qc.invalidateQueries({ queryKey: k }));
  qc.invalidateQueries({ queryKey: ['tasks', 'asset'] });
  qc.invalidateQueries({ queryKey: ['tasks', 'provider'] });
}

function applyInterval(date: Date, n: number, unit: string): Date {
  if (unit === 'd') return addDays(date, n);
  if (unit === 'm') return addMonths(date, n);
  if (unit === 'y') return addYears(date, n);
  return addDays(date, 30);
}

/**
 * Generate future occurrence dates for a recurring task.
 * - If the interval > 365 days, returns just one future date (the next occurrence).
 * - Otherwise, returns all dates within one year from startDate.
 */
function generateOccurrences(startDateStr: string, rule: string): string[] {
  const match = rule.match(/^(\d+)([dmy])$/);
  if (!match) return [];

  const n = parseInt(match[1], 10);
  const unit = match[2];
  const startDate = parseISO(startDateStr);

  // Estimate interval in days to decide strategy
  const oneStep = applyInterval(startDate, n, unit);
  const intervalDays = differenceInDays(oneStep, startDate);

  if (intervalDays > 365) {
    // Interval exceeds one year: return just the next occurrence
    return [format(oneStep, 'yyyy-MM-dd')];
  }

  // Generate all occurrences within one year
  const oneYearOut = addYears(startDate, 1);
  const dates: string[] = [];
  let current = oneStep;
  while (current <= oneYearOut && dates.length < 52) {
    dates.push(format(current, 'yyyy-MM-dd'));
    current = applyInterval(current, n, unit);
  }
  return dates;
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

export function useProviderMaintenanceTasks(providerId: string | undefined) {
  return useQuery({
    queryKey: ['tasks', 'provider', providerId],
    enabled: !!providerId,
    queryFn: async (): Promise<MaintenanceTask[]> => {
      const { data, error } = await supabase
        .from('tasks')
        .select(SELECT)
        .eq('provider_id', providerId!)
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

      // Pre-generate future occurrences for recurring tasks
      if (task.recurrence_rule && task.next_due_date) {
        const futureDates = generateOccurrences(task.next_due_date, task.recurrence_rule);
        if (futureDates.length > 0) {
          const rows = futureDates.map((date) => ({
            name: task.name,
            asset_id: task.asset_id ?? null,
            provider_id: task.provider_id ?? null,
            notes: task.notes ?? null,
            recurrence_rule: task.recurrence_rule,
            status: 'pending',
            next_due_date: date,
          }));
          const { error: bulkError } = await supabase.from('tasks').insert(rows);
          if (bulkError) throw bulkError;
        }
      }
    },
    onSuccess: () => {
      invalidateAll(qc);
      toast({ title: 'Reminder added' });
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
      // Fetch the current task to detect rule/date changes
      const { data: current, error: fetchErr } = await supabase
        .from('tasks')
        .select('name, asset_id, recurrence_rule, next_due_date, status')
        .eq('id', id)
        .single();
      if (fetchErr) throw fetchErr;

      const { error } = await supabase.from('tasks').update(updates).eq('id', id);
      if (error) throw error;

      // If recurrence_rule or next_due_date changed on a pending task, regenerate future occurrences
      const ruleChanged = updates.recurrence_rule !== undefined && updates.recurrence_rule !== current.recurrence_rule;
      const dateChanged = updates.next_due_date !== undefined && updates.next_due_date !== current.next_due_date;

      if ((ruleChanged || dateChanged) && (current.status === 'pending' || updates.status === 'pending')) {
        const oldRule = current.recurrence_rule;
        const taskName = updates.name ?? current.name;

        // Delete future pending occurrences with the old rule
        if (oldRule) {
          let deleteQuery = supabase
            .from('tasks')
            .delete()
            .eq('name', current.name)
            .eq('recurrence_rule', oldRule)
            .eq('status', 'pending')
            .neq('id', id);

          if (current.asset_id) {
            deleteQuery = deleteQuery.eq('asset_id', current.asset_id);
          } else {
            deleteQuery = deleteQuery.is('asset_id', null);
          }

          const { error: delErr } = await deleteQuery;
          if (delErr) throw delErr;
        }

        // Regenerate from new values
        const newRule = updates.recurrence_rule ?? current.recurrence_rule;
        const newDate = updates.next_due_date ?? current.next_due_date;
        if (newRule && newDate) {
          const futureDates = generateOccurrences(newDate, newRule);
          if (futureDates.length > 0) {
            const rows = futureDates.map((date) => ({
              name: taskName,
              asset_id: updates.asset_id !== undefined ? updates.asset_id : current.asset_id,
              provider_id: updates.provider_id ?? null,
              notes: updates.notes ?? null,
              recurrence_rule: newRule,
              status: 'pending',
              next_due_date: date,
            }));
            const { error: bulkErr } = await supabase.from('tasks').insert(rows);
            if (bulkErr) throw bulkErr;
          }
        }
      } else if (!ruleChanged && !dateChanged && current.recurrence_rule) {
        // Propagate field changes to all future pending siblings
        const siblingUpdates: Record<string, any> = {};
        if (updates.name !== undefined && updates.name !== current.name) siblingUpdates.name = updates.name;
        if (updates.asset_id !== undefined && updates.asset_id !== current.asset_id) siblingUpdates.asset_id = updates.asset_id;
        if (updates.provider_id !== undefined) siblingUpdates.provider_id = updates.provider_id;
        if (updates.notes !== undefined) siblingUpdates.notes = updates.notes;

        if (Object.keys(siblingUpdates).length > 0) {
          let siblingQuery = supabase
            .from('tasks')
            .update(siblingUpdates)
            .eq('name', current.name)
            .eq('recurrence_rule', current.recurrence_rule)
            .eq('status', 'pending')
            .neq('id', id);

          if (current.asset_id) {
            siblingQuery = siblingQuery.eq('asset_id', current.asset_id);
          } else {
            siblingQuery = siblingQuery.is('asset_id', null);
          }

          const { error: sibErr } = await siblingQuery;
          if (sibErr) throw sibErr;
        }
      }
    },
    onSuccess: () => {
      invalidateAll(qc);
      toast({ title: 'Reminder updated' });
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
      toast({ title: 'Reminder deleted' });
    },
    onError: (e: Error) => {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    },
  });
}

export function useCompleteMaintenanceTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (task: MaintenanceTask) => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'completed', date_completed: today })
        .eq('id', task.id);
      if (error) throw error;
      // Future occurrences are already pre-generated, so no need to create the next one
    },
    onSuccess: () => {
      invalidateAll(qc);
      toast({ title: 'Reminder completed' });
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
      return (data ?? [])
        .filter((row: any) => row.assets?.show_on_kanban === true)
        .map(mapRow);
    },
  });
}
