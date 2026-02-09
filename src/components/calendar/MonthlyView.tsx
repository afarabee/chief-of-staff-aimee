import { useMemo } from 'react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isSameDay, isToday,
} from 'date-fns';
import { CalendarItem } from '@/hooks/useCalendarTasks';
import { TaskPopover } from './TaskPopover';
import { cn } from '@/lib/utils';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface MonthlyViewProps {
  currentDate: Date;
  items: CalendarItem[];
  onDayClick: (date: Date) => void;
  onEmptyDayClick: (date: Date) => void;
  onEditItem: (item: CalendarItem) => void;
}

export function MonthlyView({ currentDate, items, onDayClick, onEmptyDayClick, onEditItem }: MonthlyViewProps) {
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentDate]);

  const itemsByDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    items.forEach((item) => {
      const key = item.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    });
    return map;
  }, [items]);

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-border">
        {DAY_NAMES.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 auto-rows-fr">
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayItems = itemsByDate.get(key) ?? [];
          const inMonth = isSameMonth(day, currentDate);
          const today = isToday(day);
          const maxShow = 3;
          const overflow = dayItems.length - maxShow;

          return (
            <div
              key={key}
              className={cn(
                'min-h-[5rem] sm:min-h-[6rem] border-b border-r border-border p-1 transition-colors',
                !inMonth && 'bg-muted/30',
                today && 'bg-primary/5',
              )}
            >
              <button
                type="button"
                onClick={() => (dayItems.length > 0 ? onDayClick(day) : onEmptyDayClick(day))}
                className={cn(
                  'mb-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors hover:bg-primary/10',
                  today && 'bg-primary text-primary-foreground hover:bg-primary/90',
                  !inMonth && 'text-muted-foreground/50',
                )}
              >
                {format(day, 'd')}
              </button>

              {/* Mobile: dots only */}
              <div className="flex gap-0.5 flex-wrap sm:hidden">
                {dayItems.map((item) => (
                  <TaskPopover key={item.id} item={item} onEdit={onEditItem}>
                    <button
                      type="button"
                      className={cn(
                        'h-2 w-2 rounded-full',
                        item.type === 'kanban' ? 'bg-primary' : 'bg-orange-500',
                      )}
                    />
                  </TaskPopover>
                ))}
              </div>

              {/* Desktop: pills */}
              <div className="hidden sm:flex flex-col gap-0.5">
                {dayItems.slice(0, maxShow).map((item) => (
                  <TaskPopover key={item.id} item={item} onEdit={onEditItem}>
                    <button
                      type="button"
                      className={cn(
                        'w-full truncate rounded px-1 py-0.5 text-left text-[10px] leading-tight text-white',
                        item.type === 'kanban' ? 'bg-primary hover:bg-primary/90' : 'bg-orange-500 hover:bg-orange-600',
                      )}
                    >
                      {item.title.length > 20 ? item.title.slice(0, 20) + '…' : item.title}
                    </button>
                  </TaskPopover>
                ))}
                {overflow > 0 && (
                  <button
                    type="button"
                    onClick={() => onDayClick(day)}
                    className="text-[10px] text-muted-foreground hover:text-foreground text-left px-1"
                  >
                    +{overflow} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
