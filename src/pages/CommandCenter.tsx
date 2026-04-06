import { useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useWeather } from '@/hooks/useWeather';
import { useDailyBriefing } from '@/hooks/useDailyBriefing';
import { useAiNews } from '@/hooks/useAiNews';
import { useCommandCenterConfig } from '@/hooks/useCommandCenterConfig';
import { useHandoffSummaries } from '@/hooks/useHandoffSummaries';
import { Button } from '@/components/ui/button';
import { QuickAdd } from '@/components/dashboard/QuickAdd';
import { BriefingWidget } from '@/components/command-center/BriefingWidget';
import { WeatherWidget } from '@/components/command-center/WeatherWidget';
import { CalendarWidget } from '@/components/command-center/CalendarWidget';
import { IdeaSpotlightWidget } from '@/components/command-center/IdeaSpotlightWidget';
import { NewsWidget } from '@/components/command-center/NewsWidget';
import { PodcastWidget } from '@/components/command-center/PodcastWidget';
import { HandoffWidget } from '@/components/command-center/HandoffWidget';
import { CustomizeDialog } from '@/components/command-center/CustomizeDialog';

const CommandCenter = () => {
  usePageTitle('Command Center');
  const queryClient = useQueryClient();
  const podcastRefetchRef = useRef<(() => void) | null>(null);

  const { data: weather, isLoading: weatherLoading } = useWeather();
  const { data: briefing, isLoading: briefingLoading, refetch: refetchBriefing } = useDailyBriefing();
  const { data: news, isLoading: newsLoading, refetch: refetchNews } = useAiNews();
  const { data: handoffSummaries, isLoading: handoffLoading } = useHandoffSummaries();
  const { widgetOrder, hiddenWidgets, toggleWidget, moveWidget } = useCommandCenterConfig();

  const handleRefresh = () => {
    refetchBriefing();
    refetchNews();
    queryClient.invalidateQueries({ queryKey: ['weather'] });
    queryClient.invalidateQueries({ queryKey: ['todays-calendar'] });
    queryClient.invalidateQueries({ queryKey: ['handoff-summaries'] });
    podcastRefetchRef.current?.();
  };

  const visibleWidgets = widgetOrder.filter((id) => !hiddenWidgets.includes(id));

  // Separate grid widgets (briefing+weather) from full-width ones
  const gridWidgets = visibleWidgets.filter((id) => id === 'briefing' || id === 'weather' || id === 'calendar');
  const fullWidgets = visibleWidgets.filter((id) => id !== 'briefing' && id !== 'weather' && id !== 'calendar');

  const renderWidget = (id: string) => {
    switch (id) {
      case 'briefing':
        return <BriefingWidget key={id} briefing={briefing} isLoading={briefingLoading} />;
      case 'weather':
        return <WeatherWidget key={id} weather={weather} isLoading={weatherLoading} />;
      case 'calendar':
        return <CalendarWidget key={id} />;
      case 'ideaSpotlight':
        return <IdeaSpotlightWidget key={id} briefing={briefing} isLoading={briefingLoading} />;
      case 'news':
        return <NewsWidget key={id} news={news} isLoading={newsLoading} />;
      case 'podcasts':
        return <PodcastWidget key={id} onRefetchRef={podcastRefetchRef} />;
      case 'handoffScanner':
        return <HandoffWidget key={id} summaries={handoffSummaries} isLoading={handoffLoading} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {briefing?.greeting || 'Command Center'}
          </h1>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2 self-start">
          <QuickAdd />
          <CustomizeDialog
            widgetOrder={widgetOrder}
            hiddenWidgets={hiddenWidgets}
            toggleWidget={toggleWidget}
            moveWidget={moveWidget}
          />
          <Button variant="outline" size="sm" onClick={handleRefresh} className="min-h-[44px] gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      {/* Grid widgets */}
      {gridWidgets.length > 0 && (
        <div className="grid gap-4 md:gap-6 md:grid-cols-3 min-w-0">
          {gridWidgets.map(renderWidget)}
        </div>
      )}

      {/* Full-width widgets */}
      {fullWidgets.map(renderWidget)}
    </div>
  );
};

export default CommandCenter;
