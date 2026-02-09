import { useMemo } from 'react';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, isToday } from 'date-fns';
import { CalendarItem, isItemCompleted } from '@/hooks/useCalendarTasks';
import { TaskPopover } from './TaskPopover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface WeeklyViewProps {
  currentDate: Date;
  items: CalendarItem[];
  onEmptyDayClick: (date: Date) => void;
  onEditItem: (item: CalendarItem) => void;
}

export function WeeklyView({ currentDate, items, onEmptyDayClick, onEditItem }: WeeklyViewProps) {
  const days = useMemo(() => {
    return eachDayOfInterval({
      start: startOfWeek(currentDate),
      end: endOfWeek(currentDate),
    });
  }, [currentDate]);

  const itemsByDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    items.forEach((item) => {
      if (!map.has(item.date)) map.set(item.date, []);
      map.get(item.date)!.push(item);
    });
    return map;
  }, [items]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
      {days.map((day) => {
        const key = format(day, 'yyyy-MM-dd');
        const dayItems = itemsByDate.get(key) ?? [];
        const today = isToday(day);

        return (
          <div
            key={key}
            onDoubleClick={() => onEmptyDayClick(day)}
            className={cn(
              'bg-card min-h-[8rem] p-2 flex flex-col gap-1.5',
              today && 'bg-primary/5',
            )}
          >
            <div className={cn(
              'text-xs font-medium text-center pb-1 border-b border-border',
              today && 'text-primary',
            )}>
              <span className="sm:hidden">{format(day, 'EEE, MMM d')}</span>
              <span className="hidden sm:inline">{format(day, 'EEE d')}</span>
            </div>

            <div className="flex-1 flex flex-col gap-1">
              {dayItems.map((item) => {
                const completed = isItemCompleted(item);
                return (
                  <TaskPopover key={item.id} item={item} onEdit={onEditItem}>
                    <button
                      type="button"
                      onClick={(e) => e.stopPropagation()}
                      className={cn(
                        'w-full text-left rounded-md border border-border p-1.5 hover:bg-accent/50 transition-colors',
                        completed && 'opacity-60',
                      )}
                    >
                      <p className="text-xs font-medium truncate">{item.title}</p>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        <Badge
                          variant="secondary"
                          className={cn(
                            'text-[10px] h-4 px-1',
                            completed
                              ? 'bg-gray-200 text-gray-500'
                              : item.type === 'kanban' ? 'bg-primary/15 text-primary' : 'bg-orange-500/15 text-orange-600',
                          )}
                        >
                          {item.type === 'kanban' ? 'Kanban' : 'Maint.'}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] h-4 px-1 capitalize">
                          {item.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </button>
                  </TaskPopover>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
