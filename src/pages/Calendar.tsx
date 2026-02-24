import { useState, useCallback, useMemo } from 'react';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ResponsiveFormDialog } from '@/components/ui/responsive-dialog';
import { useCalendarTasks, CalendarItem, isItemCompleted } from '@/hooks/useCalendarTasks';
import { MonthlyView } from '@/components/calendar/MonthlyView';
import { WeeklyView } from '@/components/calendar/WeeklyView';
import { DailyView } from '@/components/calendar/DailyView';
import { TaskForm } from '@/components/tasks/TaskForm';
import { usePageTitle } from '@/hooks/usePageTitle';

type ViewMode = 'monthly' | 'weekly' | 'daily';

export default function CalendarPage() {
  usePageTitle('Calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewMode>('monthly');
  const { items, isLoading } = useCalendarTasks();
  const [showCompleted, setShowCompleted] = useState(true);

  const filteredItems = useMemo(() => {
    if (showCompleted) return items;
    return items.filter((item) => !isItemCompleted(item));
  }, [items, showCompleted]);

  const [createDate, setCreateDate] = useState<Date | null>(null);
  const [editItem, setEditItem] = useState<CalendarItem | null>(null);

  const navigate = useCallback((dir: 1 | -1) => {
    setCurrentDate((d) => {
      if (view === 'monthly') return dir === 1 ? addMonths(d, 1) : subMonths(d, 1);
      if (view === 'weekly') return dir === 1 ? addWeeks(d, 1) : subWeeks(d, 1);
      return dir === 1 ? addDays(d, 1) : subDays(d, 1);
    });
  }, [view]);

  const periodLabel = (() => {
    if (view === 'monthly') return format(currentDate, 'MMMM yyyy');
    if (view === 'weekly') {
      const ws = startOfWeek(currentDate);
      const we = endOfWeek(currentDate);
      return `${format(ws, 'MMM d')} – ${format(we, 'MMM d, yyyy')}`;
    }
    return format(currentDate, 'EEEE, MMM d, yyyy');
  })();

  const handleDayClick = (date: Date) => { setCurrentDate(date); setView('daily'); };
  const handleEmptyDayClick = (date: Date) => { setCreateDate(date); };
  const handleEditItem = (item: CalendarItem) => {
    // Only kanban tasks are editable from the calendar; maintenance events are managed on asset pages
    if (item.type === 'kanban') setEditItem(item);
  };

  const closeCreate = () => { setCreateDate(null); };
  const closeEdit = () => { setEditItem(null); };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <div className="flex items-center gap-2">
          <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as ViewMode)} size="sm" variant="outline">
            <ToggleGroupItem value="monthly">Monthly</ToggleGroupItem>
            <ToggleGroupItem value="weekly">Weekly</ToggleGroupItem>
            <ToggleGroupItem value="daily">Daily</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">{periodLabel}</span>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-primary" />
          Kanban Tasks
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
          Maintenance
        </span>
        <span className="hidden sm:inline text-muted-foreground">Double-click a day to add a task</span>
        <div className="flex items-center gap-2 ml-auto">
          <Switch id="show-completed" checked={showCompleted} onCheckedChange={setShowCompleted} />
          <Label htmlFor="show-completed" className="text-xs cursor-pointer">Show completed</Label>
          <Button variant="outline" size="icon" className="h-7 w-7 ml-1" onClick={() => setCreateDate(new Date())}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">Loading…</div>
      ) : (
        <>
          {view === 'monthly' && <MonthlyView currentDate={currentDate} items={filteredItems} onDayClick={handleDayClick} onEmptyDayClick={handleEmptyDayClick} onEditItem={handleEditItem} />}
          {view === 'weekly' && <WeeklyView currentDate={currentDate} items={filteredItems} onEmptyDayClick={handleEmptyDayClick} onEditItem={handleEditItem} />}
          {view === 'daily' && <DailyView currentDate={currentDate} items={filteredItems} onAddTask={handleEmptyDayClick} onEditItem={handleEditItem} />}
        </>
      )}

      <ResponsiveFormDialog open={!!createDate} onOpenChange={(open) => { if (!open) closeCreate(); }} title={createDate ? `New Task for ${format(createDate, 'MMM d, yyyy')}` : 'New Task'}>
        <TaskForm task={{ dueDate: createDate ?? undefined } as any} onClose={closeCreate} />
      </ResponsiveFormDialog>

      {editItem && (
        <ResponsiveFormDialog open={!!editItem} onOpenChange={(open) => { if (!open) closeEdit(); }} title="Edit Task">
          <TaskForm
            task={{ id: editItem.id, title: editItem.title, description: editItem.description ?? '', dueDate: new Date(editItem.date + 'T00:00:00'), status: editItem.status as any, priority: editItem.priority as any, categoryId: null, createdAt: new Date(), completedAt: null, imageUrl: null }}
            onClose={closeEdit}
          />
        </ResponsiveFormDialog>
      )}
    </div>
  );
}
