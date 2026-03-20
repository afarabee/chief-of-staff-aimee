import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { addDays, addWeeks, addMonths, addYears, format, parseISO, isBefore, isAfter } from 'date-fns';
import type { MaintenanceEvent } from '@/types/maintenance';

function advanceDate(dateStr: string, freq: { interval: number; unit: string }): string {
  const date = parseISO(dateStr);
  let next: Date;
  switch (freq.unit) {
    case 'days': next = addDays(date, freq.interval); break;
    case 'weeks': next = addWeeks(date, freq.interval); break;
    case 'months': next = addMonths(date, freq.interval); break;
    case 'years': next = addYears(date, freq.interval); break;
    default: next = addMonths(date, freq.interval);
  }
  return format(next, 'yyyy-MM-dd');
}

function parseRecurrenceRule(rule: string | null): { interval: number; unit: string } | null {
  if (!rule) return null;
  const match = rule.match(/^(\d+)(d|w|m|y)$/);
  if (!match) return null;
  const interval = parseInt(match[1], 10);
  const unitMap: Record<string, string> = { d: 'days', w: 'weeks', m: 'months', y: 'years' };
  return { interval, unit: unitMap[match[2]] || 'months' };
}

export function useAllMaintenanceEvents() {
  return useQuery({
    queryKey: ['all-maintenance-events'],
    queryFn: async (): Promise<MaintenanceEvent[]> => {
      // 1. Fetch all asset enrichments
      const { data: enrichments, error: enrichErr } = await supabase
        .from('ai_enrichments')
        .select('*')
        .eq('item_type', 'asset');
      if (enrichErr) throw enrichErr;

      // 2. Fetch all completion records
      const { data: completions, error: compErr } = await supabase
        .from('tasks')
        .select('name, asset_id, date_completed')
        .eq('status', 'completed')
        .not('date_completed', 'is', null)
        .order('date_completed', { ascending: false });
      if (compErr) throw compErr;

      // 3. Fetch pending tasks from the tasks table (manually added maintenance tasks)
      const { data: pendingTasks, error: pendingErr } = await supabase
        .from('tasks')
        .select('id, name, asset_id, provider_id, next_due_date, recurrence_rule, notes, assets(name), service_providers(name)')
        .eq('status', 'pending');
      if (pendingErr) throw pendingErr;

      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');
      const thirtyDaysOut = format(addDays(today, 30), 'yyyy-MM-dd');

      // Build completion lookup: key = "name|asset_id" → most recent date_completed
      const completionMap = new Map<string, string>();
      for (const c of completions ?? []) {
        const key = `${c.name}|${c.asset_id}`;
        if (!completionMap.has(key)) {
          completionMap.set(key, c.date_completed);
        }
      }

      const events: MaintenanceEvent[] = [];

      // --- AI enrichment-based events ---
      for (const enrichment of enrichments ?? []) {
        const suggestions = Array.isArray(enrichment.suggestions) ? enrichment.suggestions : [];

        suggestions.forEach((s: any, idx: number) => {
          if (s.status !== 'scheduled' && s.status !== 'accepted') return;

          const freq = typeof s.frequency === 'object' && s.frequency
            ? s.frequency
            : null;

          const completionKey = `${s.suggestion}|${enrichment.item_id}`;
          const lastCompleted = completionMap.get(completionKey) || null;

          // Calculate next due date
          let nextDueDate = s.recommended_due_date || null;
          if (lastCompleted && freq) {
            let candidate = advanceDate(lastCompleted, freq);
            let safety = 0;
            while (candidate < todayStr && safety < 100) {
              candidate = advanceDate(candidate, freq);
              safety++;
            }
            nextDueDate = candidate;
          } else if (nextDueDate && freq && nextDueDate < todayStr) {
            let candidate = nextDueDate;
            let safety = 0;
            while (candidate < todayStr && safety < 100) {
              candidate = advanceDate(candidate, freq);
              safety++;
            }
            nextDueDate = candidate;
          }

          // Derive status
          let status: MaintenanceEvent['status'] = 'scheduled';
          if (lastCompleted && !freq) {
            status = 'completed';
          } else if (lastCompleted && freq) {
            const nextAfterCompletion = advanceDate(lastCompleted, freq);
            if (nextAfterCompletion > todayStr) {
              status = 'completed';
            } else if (nextDueDate && nextDueDate < todayStr) {
              status = 'overdue';
            } else if (nextDueDate && nextDueDate <= thirtyDaysOut) {
              status = 'upcoming';
            }
          } else if (nextDueDate) {
            if (nextDueDate < todayStr) {
              status = 'overdue';
            } else if (nextDueDate <= thirtyDaysOut) {
              status = 'upcoming';
            }
          }

          events.push({
            enrichmentId: enrichment.id,
            suggestionIndex: idx,
            name: s.suggestion,
            assetId: enrichment.item_id,
            assetName: enrichment.item_title,
            frequency: freq,
            recommendedDueDate: s.recommended_due_date || null,
            nextDueDate,
            calendarLink: s.calendar_link || null,
            calendarEventId: s.calendar_event_id || null,
            lastCompleted,
            status,
            bundledItems: Array.isArray(s.bundled_items) ? s.bundled_items : undefined,
            providerName: s.provider_name || undefined,
          });
        });
      }

      // --- Tasks-table pending events ---
      for (const task of pendingTasks ?? []) {
        const freq = parseRecurrenceRule(task.recurrence_rule);
        const nextDueDate = task.next_due_date || null;
        const completionKey = `${task.name}|${task.asset_id}`;
        const lastCompleted = completionMap.get(completionKey) || null;

        let status: MaintenanceEvent['status'] = 'scheduled';
        if (nextDueDate) {
          if (nextDueDate < todayStr) {
            status = 'overdue';
          } else if (nextDueDate <= thirtyDaysOut) {
            status = 'upcoming';
          }
        }

        const assetRow = task.assets as any;
        const providerRow = task.service_providers as any;

        events.push({
          enrichmentId: '',
          suggestionIndex: -1,
          taskId: task.id,
          name: task.name,
          assetId: task.asset_id || '',
          assetName: assetRow?.name || 'Unknown Asset',
          frequency: freq,
          recommendedDueDate: nextDueDate,
          nextDueDate,
          calendarLink: null,
          calendarEventId: null,
          lastCompleted,
          status,
          providerName: providerRow?.name || undefined,
        });
      }

      // Sort: overdue first, then upcoming, then scheduled, then completed
      const statusOrder: Record<string, number> = { overdue: 0, upcoming: 1, scheduled: 2, completed: 3 };
      events.sort((a, b) => {
        const orderDiff = (statusOrder[a.status] ?? 2) - (statusOrder[b.status] ?? 2);
        if (orderDiff !== 0) return orderDiff;
        if (a.nextDueDate && b.nextDueDate) return a.nextDueDate.localeCompare(b.nextDueDate);
        return 0;
      });

      return events;
    },
  });
}
