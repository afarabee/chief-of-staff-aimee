import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ScheduleParams {
  enrichmentId: string;
  suggestionIndex: number;
  summary: string;
  description: string;
  startDate: string;
  frequency?: { interval: number; unit: string };
}

export function useScheduleToCalendar() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ enrichmentId, suggestionIndex, summary, description, startDate, frequency }: ScheduleParams) => {
      // Call the Edge Function
      const { data, error } = await supabase.functions.invoke('create-calendar-event', {
        body: {
          summary,
          description,
          start_date: startDate,
          frequency,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Update suggestion status to 'scheduled' and store calendar link
      const { data: row, error: readErr } = await supabase
        .from('ai_enrichments')
        .select('suggestions')
        .eq('id', enrichmentId)
        .single();

      if (readErr) throw readErr;

      const suggestions = Array.isArray(row.suggestions) ? [...(row.suggestions as any[])] : [];
      if (suggestionIndex >= 0 && suggestions[suggestionIndex]) {
        // Update existing suggestion
        suggestions[suggestionIndex] = {
          ...suggestions[suggestionIndex],
          status: 'scheduled',
          calendar_event_id: data.eventId,
          calendar_link: data.htmlLink,
        };
      } else if (suggestionIndex < 0) {
        // Manual add — append a new suggestion entry
        suggestions.push({
          suggestion: summary,
          status: 'scheduled',
          result: null,
          frequency: frequency || null,
          recommended_due_date: startDate,
          calendar_event_id: data.eventId,
          calendar_link: data.htmlLink,
        });
      }

      const { error: writeErr } = await supabase
        .from('ai_enrichments')
        .update({ suggestions: suggestions as any })
        .eq('id', enrichmentId);

      if (writeErr) throw writeErr;

      return data;
    },
    onSuccess: () => {
      toast({ title: 'Scheduled to Google Calendar!' });
      queryClient.invalidateQueries({ queryKey: ['ai-enrichment-for-asset'] });
      queryClient.invalidateQueries({ queryKey: ['ai-enrichments'] });
    },
    onError: (err: Error) => {
      toast({
        title: 'Failed to schedule',
        description: err.message,
        variant: 'destructive',
      });
    },
  });
}
