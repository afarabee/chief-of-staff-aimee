import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UpdateParams {
  enrichmentId: string;
  suggestionIndex: number;
  calendarEventId?: string | null;
  updates: {
    suggestion?: string;
    frequency?: { interval: number; unit: string } | null;
    recommended_due_date?: string | null;
    provider_name?: string | null;
  };
}

export function useUpdateMaintenanceSuggestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ enrichmentId, suggestionIndex, calendarEventId, updates }: UpdateParams) => {
      // 1. Save changes to Supabase
      const { data, error: fetchErr } = await supabase
        .from('ai_enrichments')
        .select('suggestions')
        .eq('id', enrichmentId)
        .single();
      if (fetchErr) throw fetchErr;

      const suggestions = Array.isArray(data.suggestions)
        ? [...(data.suggestions as any[])]
        : [];
      suggestions[suggestionIndex] = { ...suggestions[suggestionIndex], ...updates };

      const { error: updateErr } = await supabase
        .from('ai_enrichments')
        .update({ suggestions: suggestions as any })
        .eq('id', enrichmentId);
      if (updateErr) throw updateErr;

      // 2. If there's a linked calendar event, push the changes to Google Calendar too
      if (calendarEventId && updates.suggestion && updates.recommended_due_date) {
        const { error: calErr } = await supabase.functions.invoke('update-calendar-event', {
          body: {
            event_id: calendarEventId,
            summary: updates.suggestion,
            start_date: updates.recommended_due_date,
            frequency: updates.frequency ?? null,
          },
        });

        if (calErr) {
          // Calendar sync failed — warn but don't block (local save already succeeded)
          console.warn('Calendar update failed:', calErr.message);
          return { calendarSynced: false };
        }
      }

      return { calendarSynced: !!calendarEventId };
    },
    onSuccess: ({ calendarSynced }) => {
      qc.invalidateQueries({ queryKey: ['all-maintenance-events'] });
      toast({
        title: 'Task updated',
        description: calendarSynced ? 'Google Calendar event updated too.' : undefined,
      });
    },
    onError: (e: Error) => {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    },
  });
}
