import { CalendarDays, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTodaysCalendar, CalendarEvent } from '@/hooks/useTodaysCalendar';
import { openExternalUrl } from '@/lib/openExternalUrl';

function formatTime(dateStr: string, allDay: boolean): string {
  if (allDay) return 'All day';
  try {
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}

function getDayLabel(dateStr: string): string {
  const eventDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);

  const eventDay = new Date(eventDate);
  eventDay.setHours(0, 0, 0, 0);

  if (eventDay.getTime() === today.getTime()) return 'Today';
  if (eventDay.getTime() === tomorrow.getTime()) return 'Tomorrow';
  return eventDate.toLocaleDateString('en-US', { weekday: 'long' });
}

function groupByDay(events: CalendarEvent[]): Record<string, CalendarEvent[]> {
  const groups: Record<string, CalendarEvent[]> = {};
  for (const event of events) {
    const label = getDayLabel(event.start);
    if (!groups[label]) groups[label] = [];
    groups[label].push(event);
  }
  return groups;
}

export function CalendarWidget() {
  const { data: events, isLoading } = useTodaysCalendar();
  const grouped = events ? groupByDay(events) : {};
  const dayLabels = Object.keys(grouped);

  // Ensure all 3 days show even if empty
  const today = new Date();
  const expectedDays = ['Today', 'Tomorrow'];
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);
  expectedDays.push(dayAfter.toLocaleDateString('en-US', { weekday: 'long' }));

  return (
    <Card className="border-indigo-200 bg-indigo-50 dark:bg-indigo-950/30 shadow-md min-w-0 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-indigo-500" />
          <CardTitle className="text-lg">Calendar (3-Day Look)</CardTitle>
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
        ) : (
          <div className="space-y-3">
            {expectedDays.map((dayLabel) => {
              const dayEvents = grouped[dayLabel] || [];
              return (
                <div key={dayLabel}>
                  <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1">{dayLabel}</p>
                  {dayEvents.length > 0 ? (
                    <div className="divide-y divide-border">
                      {dayEvents.map((event: CalendarEvent) => (
                        <div key={event.id} className="py-1.5 first:pt-0 last:pb-0 flex items-start gap-3">
                          <span className="text-xs font-medium text-muted-foreground w-16 shrink-0 pt-0.5">
                            {formatTime(event.start, event.allDay)}
                          </span>
                          <span className="text-sm text-foreground flex-1 min-w-0 truncate">{event.summary}</span>
                          {event.htmlLink && (
                            <button onClick={() => openExternalUrl(event.htmlLink!)} className="shrink-0 text-muted-foreground hover:text-primary">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Nothing scheduled</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
