import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SyncParams {
  assetId?: string;
}

export function useSyncFromCalendar() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ assetId }: SyncParams = {}) => {
      // 1. Fetch enrichments (optionally filtered to one asset)
      let query = supabase
        .from('ai_enrichments')
        .select('id, item_id, suggestions')
        .eq('item_type', 'asset');

      if (assetId) {
        query = query.eq('item_id', assetId);
      }

      const { data: enrichments, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;

      // 2. Collect all scheduled suggestions with calendar_event_id
      const eventMap: { enrichmentId: string; suggestionIndex: number; eventId: string }[] = [];

      for (const enrichment of enrichments ?? []) {
        const suggestions = Array.isArray(enrichment.suggestions) ? enrichment.suggestions : [];
        suggestions.forEach((s: any, idx: number) => {
          if (s.status === 'scheduled' && s.calendar_event_id) {
            eventMap.push({
              enrichmentId: enrichment.id,
              suggestionIndex: idx,
              eventId: s.calendar_event_id,
            });
          }
        });
      }

      if (eventMap.length === 0) {
        return { synced: 0, removed: 0 };
      }

      // 3. Call edge function to check event statuses
      const uniqueEventIds = [...new Set(eventMap.map((e) => e.eventId))];

      const { data, error } = await supabase.functions.invoke('sync-calendar-events', {
        body: { event_ids: uniqueEventIds },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const results: Record<string, string> = data.results || {};

      // 4. Find events that were deleted or cancelled
      const toRevert = eventMap.filter((e) => {
        const status = results[e.eventId];
        return status === 'not_found' || status === 'cancelled';
      });

      if (toRevert.length === 0) {
        return { synced: eventMap.length, removed: 0 };
      }

      // 5. Group reverts by enrichmentId for batch updates
      const revertsByEnrichment = new Map<string, number[]>();
      for (const item of toRevert) {
        const existing = revertsByEnrichment.get(item.enrichmentId) || [];
        existing.push(item.suggestionIndex);
        revertsByEnrichment.set(item.enrichmentId, existing);
      }

      // 6. Update each enrichment
      for (const [enrichmentId, indices] of revertsByEnrichment) {
        const { data: row, error: readErr } = await supabase
          .from('ai_enrichments')
          .select('suggestions')
          .eq('id', enrichmentId)
          .single();

        if (readErr) throw readErr;

        const suggestions = Array.isArray(row.suggestions) ? [...(row.suggestions as any[])] : [];

        for (const idx of indices) {
          if (suggestions[idx]) {
            suggestions[idx] = {
              ...suggestions[idx],
              status: 'accepted',
              calendar_event_id: null,
              calendar_link: null,
            };
          }
        }

        const { error: writeErr } = await supabase
          .from('ai_enrichments')
          .update({ suggestions: suggestions as any })
          .eq('id', enrichmentId);

        if (writeErr) throw writeErr;
      }

      return { synced: eventMap.length, removed: toRevert.length };
    },
    onSuccess: (result) => {
      if (result.removed > 0) {
        toast({
          title: 'Calendar synced',
          description: `${result.removed} event${result.removed === 1 ? '' : 's'} removed from calendar — reverted to accepted.`,
        });
      } else {
        toast({ title: 'Calendar synced', description: 'All events are up to date.' });
      }
      queryClient.invalidateQueries({ queryKey: ['all-maintenance-events'] });
      queryClient.invalidateQueries({ queryKey: ['ai-enrichment-for-asset'] });
      queryClient.invalidateQueries({ queryKey: ['ai-enrichments'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-maintenance-tasks'] });
    },
    onError: (err: Error) => {
      toast({
        title: 'Sync failed',
        description: err.message,
        variant: 'destructive',
      });
    },
  });
}
