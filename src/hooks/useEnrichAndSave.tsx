import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';

interface EnrichAndSaveParams {
  itemType: 'task' | 'idea' | 'reminder' | 'asset';
  itemTitle: string;
  itemData: Record<string, any>;
  itemId?: string;
  onSaveNew?: () => Promise<string>;
  onSaveExisting?: () => Promise<void>;
  onClose?: () => void;
}

export function useEnrichAndSave() {
  const [isEnriching, setIsEnriching] = useState(false);
  const queryClient = useQueryClient();

  const enrich = async ({
    itemType,
    itemTitle,
    itemData,
    itemId,
    onSaveNew,
    onSaveExisting,
    onClose,
  }: EnrichAndSaveParams) => {
    setIsEnriching(true);
    const loadingToastId = toast({
      title: itemType === 'asset' ? 'AI is analyzing this asset...' : 'AI is working on it...',
      description: itemType === 'asset' ? 'Generating maintenance suggestions' : 'Generating suggestions',
    });

    try {
      // Step 1: Auto-save (skip for assets — they already exist)
      let resolvedId = itemId;
      if (!resolvedId && onSaveNew) {
        resolvedId = await onSaveNew();
      } else if (resolvedId && onSaveExisting) {
        await onSaveExisting();
      }

      if (!resolvedId) {
        throw new Error('Failed to save item');
      }

      // Step 2: Call enrich-item edge function
      const { data, error } = await supabase.functions.invoke('enrich-item', {
        body: {
          item_type: itemType,
          item: { id: resolvedId, ...itemData },
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Parse suggestions
      const rawSuggestions = typeof data.suggestions === 'string'
        ? JSON.parse(data.suggestions)
        : data.suggestions;

      // Format suggestions — preserve asset-specific fields
      const formattedSuggestions = (rawSuggestions as Array<Record<string, any>>).map((s) => ({
        suggestion: s.suggestion,
        status: 'pending' as const,
        result: null as string | null,
      ...(s.frequency ? { frequency: s.frequency } : {}),
      ...(s.recommended_due_date ? { recommended_due_date: s.recommended_due_date } : {}),
      ...(s.bundled_items ? { bundled_items: s.bundled_items } : {}),
    }));

      // Step 3: Insert into ai_enrichments
      const { error: insertErr } = await supabase.from('ai_enrichments').insert({
        item_type: itemType,
        item_id: resolvedId,
        item_title: itemTitle,
        suggestions: formattedSuggestions as any,
      });

      if (insertErr) throw insertErr;

      // Step 4: Invalidate & toast
      queryClient.invalidateQueries({ queryKey: ['ai-enrichments'] });
      if (itemType === 'asset' && resolvedId) {
        queryClient.invalidateQueries({ queryKey: ['ai-enrichment-for-asset', resolvedId] });
      }

      loadingToastId.dismiss?.();

      if (itemType === 'asset') {
        toast({
          title: 'Maintenance schedule generated!',
          description: `${formattedSuggestions.length} suggestions generated`,
        });
      } else {
        toast({
          title: 'Enrichment complete!',
          description: `${formattedSuggestions.length} suggestions generated`,
          action: <ToastAction altText="View AI Activity" onClick={() => { window.location.href = '/ai-activity'; }}>View</ToastAction>,
        });
      }

      // Close modal if new item
      if (!itemId && onClose) {
        onClose();
      }
    } catch (e: any) {
      loadingToastId.dismiss?.();
      toast({
        title: 'AI enrichment failed',
        description: e.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsEnriching(false);
    }
  };

  return { enrich, isEnriching };
}
