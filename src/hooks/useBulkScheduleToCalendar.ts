import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { MaintenanceEvent } from '@/types/maintenance';

export function useBulkScheduleToCalendar() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (events: MaintenanceEvent[]) => {
      const unscheduled = events.filter(e => !e.calendarEventId && e.status !== 'completed');
      if (unscheduled.length === 0) return 0;

      // Call edge function for each event, collect results
      type CalResult = {
        enrichmentId: string;
        suggestionIndex: number;
        eventId: string;
        htmlLink: string;
      };
      const results: CalResult[] = [];

      for (const event of unscheduled) {
        const description = `Asset: ${event.assetName}${
          event.bundledItems && event.bundledItems.length > 0
            ? `\n\nMaintenance checklist:\n${event.bundledItems.map(i => `- ${i}`).join('\n')}`
            : ''
        }`;

        const { data, error } = await supabase.functions.invoke('create-calendar-event', {
          body: {
            summary: `${event.assetName}: ${event.name}`,
            description,
            start_date: event.nextDueDate || event.recommendedDueDate || new Date().toISOString().split('T')[0],
            frequency: event.frequency ?? undefined,
          },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        results.push({
          enrichmentId: event.enrichmentId,
          suggestionIndex: event.suggestionIndex,
          eventId: data.eventId,
          htmlLink: data.htmlLink,
        });
      }

      // Group results by enrichmentId for efficient DB writes (one read+write per enrichment)
      const byEnrichment = new Map<string, CalResult[]>();
      for (const r of results) {
        if (!byEnrichment.has(r.enrichmentId)) byEnrichment.set(r.enrichmentId, []);
        byEnrichment.get(r.enrichmentId)!.push(r);
      }

      for (const [enrichmentId, updates] of byEnrichment) {
        const { data: row, error: readErr } = await supabase
          .from('ai_enrichments')
          .select('suggestions')
          .eq('id', enrichmentId)
          .single();

        if (readErr) throw readErr;

        const suggestions = Array.isArray(row.suggestions) ? [...(row.suggestions as any[])] : [];
        for (const u of updates) {
          if (suggestions[u.suggestionIndex]) {
            suggestions[u.suggestionIndex] = {
              ...suggestions[u.suggestionIndex],
              status: 'scheduled',
              calendar_event_id: u.eventId,
              calendar_link: u.htmlLink,
            };
          }
        }

        const { error: writeErr } = await supabase
          .from('ai_enrichments')
          .update({ suggestions: suggestions as any })
          .eq('id', enrichmentId);

        if (writeErr) throw writeErr;
      }

      return results.length;
    },
    onSuccess: (count) => {
      toast({ title: `Scheduled ${count} task${count === 1 ? '' : 's'} to Google Calendar` });
      queryClient.invalidateQueries({ queryKey: ['ai-enrichment-for-asset'] });
      queryClient.invalidateQueries({ queryKey: ['ai-enrichments'] });
      queryClient.invalidateQueries({ queryKey: ['all-maintenance-events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-maintenance-tasks'] });
    },
    onError: (err: Error) => {
      toast({
        title: 'Failed to schedule tasks',
        description: err.message,
        variant: 'destructive',
      });
    },
  });
}
