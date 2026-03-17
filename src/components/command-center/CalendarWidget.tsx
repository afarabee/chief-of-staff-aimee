import { CalendarDays, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTodaysCalendar, CalendarEvent } from '@/hooks/useTodaysCalendar';

function formatTime(dateStr: string, allDay: boolean): string {
  if (allDay) return 'All day';
  try {
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function CalendarWidget() {
  const { data: events, isLoading } = useTodaysCalendar();

  return (
    <Card className="border-indigo-200 bg-indigo-50 dark:bg-indigo-950/30 shadow-md min-w-0 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-indigo-500" />
          <CardTitle className="text-lg">Today's Calendar</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        ) : events && events.length > 0 ? (
          <div className="divide-y divide-border">
            {events.map((event: CalendarEvent) => (
              <div key={event.id} className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-3">
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 w-16 shrink-0 pt-0.5">
                  {formatTime(event.start, event.allDay)}
                </span>
                <span className="text-sm text-foreground flex-1 min-w-0 truncate">{event.summary}</span>
                {event.htmlLink && (
                  <a href={event.htmlLink} target="_blank" rel="noopener noreferrer" className="shrink-0 text-muted-foreground hover:text-primary">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No events today ✨</p>
        )}
      </CardContent>
    </Card>
  );
}
