import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const DEFAULT_ORDER = ['briefing', 'weather', 'calendar', 'ideaSpotlight', 'news', 'podcasts'];

interface CommandCenterConfig {
  id: string;
  widget_order: string[];
  hidden_widgets: string[];
}

async function fetchConfig(): Promise<CommandCenterConfig> {
  const { data, error } = await supabase
    .from('command_center_config')
    .select('*')
    .limit(1)
    .single();

  if (error) throw error;
  return {
    id: data.id,
    widget_order: data.widget_order || DEFAULT_ORDER,
    hidden_widgets: data.hidden_widgets || [],
  };
}

export function useCommandCenterConfig() {
  const queryClient = useQueryClient();
  const queryKey = ['command-center-config'];

  const { data: config, isLoading } = useQuery({
    queryKey,
    queryFn: fetchConfig,
    staleTime: Infinity,
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: { widget_order?: string[]; hidden_widgets?: string[] }) => {
      if (!config) return;
      const { error } = await supabase
        .from('command_center_config')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', config.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const widgetOrder = config?.widget_order || DEFAULT_ORDER;
  const hiddenWidgets = config?.hidden_widgets || [];

  const toggleWidget = (widgetId: string) => {
    const next = hiddenWidgets.includes(widgetId)
      ? hiddenWidgets.filter((w) => w !== widgetId)
      : [...hiddenWidgets, widgetId];
    updateMutation.mutate({ hidden_widgets: next });
  };

  const moveWidget = (widgetId: string, direction: 'up' | 'down') => {
    const idx = widgetOrder.indexOf(widgetId);
    if (idx === -1) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= widgetOrder.length) return;
    const next = [...widgetOrder];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    updateMutation.mutate({ widget_order: next });
  };

  return { widgetOrder, hiddenWidgets, isLoading, toggleWidget, moveWidget };
}
