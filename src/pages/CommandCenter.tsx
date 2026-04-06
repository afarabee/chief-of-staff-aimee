import { useState, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useWeather } from '@/hooks/useWeather';
import { useDailyBriefing } from '@/hooks/useDailyBriefing';
import { useAiNews } from '@/hooks/useAiNews';
import { useApp } from '@/contexts/AppContext';
import { useCommandCenterConfig } from '@/hooks/useCommandCenterConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BriefingWidget } from '@/components/command-center/BriefingWidget';
import { WeatherWidget } from '@/components/command-center/WeatherWidget';
import { CalendarWidget } from '@/components/command-center/CalendarWidget';
import { IdeaSpotlightWidget } from '@/components/command-center/IdeaSpotlightWidget';
import { NewsWidget } from '@/components/command-center/NewsWidget';
import { PodcastWidget } from '@/components/command-center/PodcastWidget';
import { CustomizeDialog } from '@/components/command-center/CustomizeDialog';

const CommandCenter = () => {
  usePageTitle('Command Center');
  const queryClient = useQueryClient();
  const { addIdea } = useApp();
  const [captureText, setCaptureText] = useState('');
  const podcastRefetchRef = useRef<(() => void) | null>(null);

  const { data: weather, isLoading: weatherLoading } = useWeather();
  const { data: briefing, isLoading: briefingLoading, refetch: refetchBriefing } = useDailyBriefing();
  const { data: news, isLoading: newsLoading, refetch: refetchNews } = useAiNews();
  const { widgetOrder, hiddenWidgets, toggleWidget, moveWidget } = useCommandCenterConfig();

  const handleRefresh = () => {
    refetchBriefing();
    refetchNews();
    queryClient.invalidateQueries({ queryKey: ['weather'] });
    queryClient.invalidateQueries({ queryKey: ['todays-calendar'] });
    podcastRefetchRef.current?.();
  };

  const handleQuickCapture = () => {
    if (!captureText.trim()) return;
    addIdea({ title: captureText.trim(), description: '', status: 'new', categoryId: null, imageUrl: null });
    setCaptureText('');
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

      {/* Quick Capture */}
      <div className="flex gap-2">
        <Input
          placeholder="Quick add..."
          value={captureText}
          onChange={(e) => setCaptureText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleQuickCapture()}
          className="flex-1"
        />
        <Button onClick={handleQuickCapture} disabled={!captureText.trim()} className="min-h-[44px]">
          Save
        </Button>
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
