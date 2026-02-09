import { useMemo } from 'react';
import { format } from 'date-fns';
import { CalendarItem, isItemCompleted } from '@/hooks/useCalendarTasks';
import { cn } from '@/lib/utils';
import { TaskPopover } from './TaskPopover';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface DailyViewProps {
  currentDate: Date;
  items: CalendarItem[];
  onAddTask: (date: Date) => void;
  onEditItem: (item: CalendarItem) => void;
}

export function DailyView({ currentDate, items, onAddTask, onEditItem }: DailyViewProps) {
  const dateKey = format(currentDate, 'yyyy-MM-dd');

  const { kanbanItems, maintenanceItems } = useMemo(() => {
    const dayItems = items.filter((i) => i.date === dateKey);
    return {
      kanbanItems: dayItems.filter((i) => i.type === 'kanban'),
      maintenanceItems: dayItems.filter((i) => i.type === 'maintenance'),
    };
  }, [items, dateKey]);

  const isEmpty = kanbanItems.length === 0 && maintenanceItems.length === 0;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">{format(currentDate, 'EEEE, MMMM d, yyyy')}</h2>

      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground mb-4">No tasks scheduled for this day</p>
          <Button onClick={() => onAddTask(currentDate)}>
            <Plus className="h-4 w-4 mr-2" />
            Add a task
          </Button>
        </div>
      )}

      {kanbanItems.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-primary" />
            Kanban Tasks
          </h3>
          <div className="space-y-2">
            {kanbanItems.map((item) => {
              const completed = isItemCompleted(item);
              return (
                <TaskPopover key={item.id} item={item} onEdit={onEditItem}>
                  <button type="button" className={cn("w-full text-left rounded-lg border border-border bg-card p-3 hover:shadow-sm transition-shadow", completed && "opacity-60")}>
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("font-medium text-sm", completed && "line-through")}>{item.title}</p>
                    <div className="flex gap-1 shrink-0">
                      <Badge variant="outline" className="capitalize text-xs">{item.status.replace(/-/g, ' ')}</Badge>
                      {item.priority && <Badge variant="outline" className="capitalize text-xs">{item.priority}</Badge>}
                    </div>
                  </div>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                  )}
                  </button>
                </TaskPopover>
              );
            })}
          </div>
        </section>
      )}

      {maintenanceItems.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-orange-500" />
            Maintenance Tasks
          </h3>
          <div className="space-y-2">
            {maintenanceItems.map((item) => {
              const completed = isItemCompleted(item);
              return (
                <TaskPopover key={item.id} item={item} onEdit={onEditItem}>
                  <button type="button" className={cn("w-full text-left rounded-lg border border-border bg-card p-3 hover:shadow-sm transition-shadow", completed && "opacity-60")}>
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("font-medium text-sm", completed && "line-through")}>{item.title}</p>
                    <Badge variant="outline" className="capitalize text-xs">{item.status.replace(/_/g, ' ')}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                    {item.assetName && <span>Asset: {item.assetName}</span>}
                    {item.providerName && <span>Provider: {item.providerName}</span>}
                    {item.recurrenceRule && <span>Recurrence: {item.recurrenceRule}</span>}
                  </div>
                  </button>
                </TaskPopover>
              );
            })}
          </div>
        </section>
      )}

      {!isEmpty && (
        <Button variant="outline" onClick={() => onAddTask(currentDate)} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add a task
        </Button>
      )}
    </div>
  );
}
