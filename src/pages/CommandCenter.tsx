import { useState, useRef } from 'react';
import { RefreshCw, Sparkles, Cloud, Newspaper, Lightbulb, ArrowRight, ExternalLink } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useWeather, getWeatherInfo } from '@/hooks/useWeather';
import { useDailyBriefing } from '@/hooks/useDailyBriefing';
import { useAiNews } from '@/hooks/useAiNews';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { PodcastWidget } from '@/components/command-center/PodcastWidget';

const suggestionTypeColors: Record<string, string> = {
  reschedule: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  focus: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
  unblock: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  idea: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
  general: 'bg-muted text-muted-foreground',
};

const CommandCenter = () => {
  usePageTitle('Command Center');
  const queryClient = useQueryClient();
  const { addIdea } = useApp();
  const [captureText, setCaptureText] = useState('');
  const podcastRefetchRef = useRef<(() => void) | null>(null);

  const { data: weather, isLoading: weatherLoading } = useWeather();
  const { data: briefing, isLoading: briefingLoading, refetch: refetchBriefing } = useDailyBriefing();
  const { data: news, isLoading: newsLoading, refetch: refetchNews } = useAiNews();

  const handleRefresh = () => {
    refetchBriefing();
    refetchNews();
    queryClient.invalidateQueries({ queryKey: ['weather'] });
  };

  const handleQuickCapture = () => {
    if (!captureText.trim()) return;
    addIdea({ title: captureText.trim(), description: '', status: 'new', categoryId: null, imageUrl: null });
    setCaptureText('');
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
        <Button variant="outline" size="sm" onClick={handleRefresh} className="min-h-[44px] gap-2 self-start">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Quick Capture */}
      <div className="flex gap-2">
        <Input
          placeholder="Capture a thought..."
          value={captureText}
          onChange={(e) => setCaptureText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleQuickCapture()}
          className="flex-1"
        />
        <Button onClick={handleQuickCapture} disabled={!captureText.trim()} className="min-h-[44px]">
          Save
        </Button>
      </div>

      {/* Main Grid */}
      <div className="grid gap-4 md:gap-6 md:grid-cols-3 min-w-0">
        {/* AI Briefing — spans 2 cols */}
        <Card className="md:col-span-2 border-primary/20 bg-primary/5 shadow-md min-w-0 overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">AI Daily Briefing</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {briefingLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-5 w-3/5" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-8 w-40" />
                </div>
              </div>
            ) : briefing ? (
              <>
                <p className="text-sm text-foreground leading-relaxed">{briefing.summary}</p>
                <div className="flex flex-wrap gap-2">
                  {briefing.suggestions.map((s, i) => (
                    <Badge key={i} variant="secondary" className={`text-xs px-3 py-1.5 ${suggestionTypeColors[s.type] || suggestionTypeColors.general}`}>
                      {s.text}
                    </Badge>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Unable to load briefing. Try refreshing.</p>
            )}
          </CardContent>
        </Card>

        {/* Weather */}
        <Card className="border-sky-200 bg-sky-50 dark:bg-sky-950/30 shadow-md min-w-0 overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-sky-500" />
              <CardTitle className="text-lg">Weather</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {weatherLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-24" />
                <Skeleton className="h-4 w-32" />
                <div className="flex gap-3 pt-2">
                  <Skeleton className="h-16 w-16" />
                  <Skeleton className="h-16 w-16" />
                  <Skeleton className="h-16 w-16" />
                </div>
              </div>
            ) : weather ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{getWeatherInfo(weather.current.weathercode).icon}</span>
                  <div>
                    <p className="text-3xl font-bold text-foreground">{Math.round(weather.current.temperature)}°F</p>
                    <p className="text-xs text-muted-foreground">{getWeatherInfo(weather.current.weathercode).label}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  {weather.forecast.map((day, i) => {
                    const info = getWeatherInfo(day.weathercode);
                    const label = i === 0 ? 'Today' : new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' });
                    return (
                      <div key={day.date} className="flex-1 text-center rounded-lg bg-background/50 p-2">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="text-lg">{info.icon}</p>
                        <p className="text-xs font-medium">{Math.round(day.tempMax)}° / {Math.round(day.tempMin)}°</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Weather unavailable</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Idea Spotlight */}
      <Card className="border-violet-200 bg-violet-50 dark:bg-violet-950/30 shadow-md min-w-0 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-violet-500" />
              <CardTitle className="text-lg">Idea Spotlight</CardTitle>
            </div>
            <Button variant="ghost" size="sm" className="min-h-[44px]" asChild>
              <Link to="/ideas" className="gap-1">
                All ideas <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {briefingLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-64" />
              <div className="space-y-2 pt-2">
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-4 w-52" />
              </div>
            </div>
          ) : briefing?.ideaSpotlight ? (
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-foreground">{briefing.ideaSpotlight.title}</h3>
                <p className="text-sm text-muted-foreground">{briefing.ideaSpotlight.reason}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Next Steps</p>
                {briefing.ideaSpotlight.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-200 dark:bg-violet-800 text-xs font-bold text-violet-700 dark:text-violet-200">{i + 1}</span>
                    {step}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No idea spotlight available.</p>
          )}
        </CardContent>
      </Card>

      {/* AI News */}
      <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 shadow-md min-w-0 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-lg">Top AI News</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {newsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          ) : news && news.length > 0 ? (
            <div className="divide-y divide-border">
              {news.map((article, i) => (
                <div key={i} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-foreground leading-snug">{article.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{article.snippet}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{article.source}</Badge>
                        {article.url && article.url.startsWith('http') && (
                          <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-0.5">
                            Read <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No news available. Try refreshing.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CommandCenter;
