import { Cloud } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getWeatherInfo } from '@/hooks/useWeather';

interface WeatherWidgetProps {
  weather: any;
  isLoading: boolean;
}

export function WeatherWidget({ weather, isLoading }: WeatherWidgetProps) {
  return (
    <Card className="border-sky-200 bg-sky-50 dark:bg-sky-950/30 shadow-md min-w-0 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Cloud className="h-5 w-5 text-sky-500" />
          <CardTitle className="text-lg">Weather</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
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
              {weather.forecast.map((day: any, i: number) => {
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
  );
}
