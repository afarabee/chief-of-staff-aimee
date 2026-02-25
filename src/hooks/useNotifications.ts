import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { addDays, addWeeks, addMonths, addYears, format, parseISO } from 'date-fns';

export interface NotificationItem {
  id: string;
  title: string;
  type: 'task' | 'maintenance';
  assetName?: string;
  dueDate: string;
  urgency: 'overdue' | 'upcoming';
  daysOffset: number;
  link: string;
}

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

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async (): Promise<NotificationItem[]> => {
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');
      const sevenDaysOut = format(addDays(today, 7), 'yyyy-MM-dd');
      const items: NotificationItem[] = [];

      // --- Source 1: cos_tasks with due_date ---
      const { data: tasks } = await supabase
        .from('cos_tasks')
        .select('id, title, due_date, status')
        .not('due_date', 'is', null)
        .neq('status', 'done')
        .lte('due_date', sevenDaysOut);

      for (const t of tasks ?? []) {
        const due = t.due_date!;
        const diffMs = parseISO(due).getTime() - today.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        items.push({
          id: `task-${t.id}`,
          title: t.title,
          type: 'task',
          dueDate: due,
          urgency: due < todayStr ? 'overdue' : 'upcoming',
          daysOffset: diffDays,
          link: `/tasks?edit=${t.id}`,
        });
      }

      // --- Source 2: Maintenance events from ai_enrichments ---
      const { data: enrichments } = await supabase
        .from('ai_enrichments')
        .select('*')
        .eq('item_type', 'asset');

      const { data: completions } = await supabase
        .from('tasks')
        .select('name, asset_id, date_completed')
        .eq('status', 'completed')
        .not('date_completed', 'is', null)
        .order('date_completed', { ascending: false });

      const completionMap = new Map<string, string>();
      for (const c of completions ?? []) {
        const key = `${c.name}|${c.asset_id}`;
        if (!completionMap.has(key)) completionMap.set(key, c.date_completed);
      }

      for (const enrichment of enrichments ?? []) {
        const suggestions = Array.isArray(enrichment.suggestions) ? enrichment.suggestions : [];
        for (const s of suggestions as any[]) {
          if (s.status !== 'scheduled') continue;

          const freq = typeof s.frequency === 'object' && s.frequency ? s.frequency : null;
          const completionKey = `${s.suggestion}|${enrichment.item_id}`;
          const lastCompleted = completionMap.get(completionKey) || null;

          // Calculate next due date (same logic as useAllMaintenanceEvents)
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

          if (!nextDueDate) continue;

          // Skip if completed within current period
          if (lastCompleted && freq) {
            const nextAfterCompletion = advanceDate(lastCompleted, freq);
            if (nextAfterCompletion > todayStr) continue;
          }

          const isOverdue = nextDueDate < todayStr;
          const isUpcoming = nextDueDate >= todayStr && nextDueDate <= sevenDaysOut;
          if (!isOverdue && !isUpcoming) continue;

          const diffMs = parseISO(nextDueDate).getTime() - today.getTime();
          const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
          items.push({
            id: `maint-${enrichment.id}-${s.suggestion}`,
            title: s.suggestion,
            type: 'maintenance',
            assetName: enrichment.item_title,
            dueDate: nextDueDate,
            urgency: isOverdue ? 'overdue' : 'upcoming',
            daysOffset: diffDays,
            link: `/ai-activity/${enrichment.id}`,
          });
        }
      }

      // Sort: most overdue first, then upcoming soonest first
      items.sort((a, b) => a.daysOffset - b.daysOffset);
      return items;
    },
    refetchInterval: 5 * 60 * 1000,
  });
}
