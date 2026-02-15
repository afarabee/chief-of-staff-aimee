import { useState, useMemo } from 'react';
import { parseISO, isPast, isToday } from 'date-fns';
import { ClipboardCheck, Plus, ChevronDown } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useMaintenanceTasks, useCompleteMaintenanceTask } from '@/hooks/useMaintenanceTasks';
import { MaintenanceTaskCard } from '@/components/maintenance/MaintenanceTaskCard';
import { MaintenanceTaskForm } from '@/components/maintenance/MaintenanceTaskForm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { MaintenanceTask } from '@/types/maintenance';

interface SectionProps {
  title: string;
  count: number;
  accentClass: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function Section({ title, count, accentClass, defaultOpen = true, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full group">
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', !open && '-rotate-90')} />
        <h2 className={cn('text-sm font-semibold uppercase tracking-wide', accentClass)}>{title}</h2>
        <Badge variant="secondary" className="text-xs">{count}</Badge>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function Maintenance() {
  usePageTitle('Reminders');
  const { data: tasks = [], isLoading } = useMaintenanceTasks();
  const completeTask = useCompleteMaintenanceTask();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<MaintenanceTask | undefined>();


  const { overdue, attention, inProgress, upcoming, completed } = useMemo(() => {
    const overdue: MaintenanceTask[] = [];
    const attention: MaintenanceTask[] = [];
    const inProgress: MaintenanceTask[] = [];
    const upcoming: MaintenanceTask[] = [];
    const completed: MaintenanceTask[] = [];

    tasks.forEach((t) => {
      if (t.status === 'completed') {
        completed.push(t);
      } else if (t.status === 'needs_attention') {
        attention.push(t);
      } else if (t.status === 'in_progress') {
        inProgress.push(t);
      } else if (t.status === 'overdue') {
        overdue.push(t);
      } else if (t.status === 'pending' && t.nextDueDate) {
        const d = parseISO(t.nextDueDate);
        if (isPast(d) && !isToday(d)) {
          overdue.push(t);
        } else {
          upcoming.push(t);
        }
      } else if (t.status === 'pending') {
        upcoming.push(t); // no due date
      }
    });

    // Sort overdue: most overdue first (earliest date first)
    overdue.sort((a, b) => (a.nextDueDate ?? '').localeCompare(b.nextDueDate ?? ''));
    // attention: by due date asc
    attention.sort((a, b) => (a.nextDueDate ?? '9').localeCompare(b.nextDueDate ?? '9'));
    // in progress: by due date asc
    inProgress.sort((a, b) => (a.nextDueDate ?? '9').localeCompare(b.nextDueDate ?? '9'));
    // upcoming: by due date asc
    upcoming.sort((a, b) => (a.nextDueDate ?? '9').localeCompare(b.nextDueDate ?? '9'));
    // completed: by date_completed desc
    completed.sort((a, b) => (b.dateCompleted ?? '').localeCompare(a.dateCompleted ?? ''));

    return { overdue, attention, inProgress, upcoming, completed: completed.slice(0, 20) };
  }, [tasks]);

  const openAdd = () => { setEditingTask(undefined); setIsFormOpen(true); };
  const openEdit = (t: MaintenanceTask) => { setEditingTask(t); setIsFormOpen(true); };
  const closeForm = () => setIsFormOpen(false);

  const isEmpty = tasks.length === 0 && !isLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Reminders</h1>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add Reminder
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : isEmpty ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <ClipboardCheck className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No reminders yet. Add a reminder or generate a maintenance plan from an asset.</p>
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add Reminder
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {overdue.length > 0 && (
            <Section title="Overdue" count={overdue.length} accentClass="text-destructive">
              {overdue.map((t) => (
                <MaintenanceTaskCard key={t.id} task={t} variant="overdue" onComplete={() => completeTask.mutate(t)} onClick={() => openEdit(t)} />
              ))}
            </Section>
          )}

          {attention.length > 0 && (
            <Section title="Needs Attention" count={attention.length} accentClass="text-amber-500">
              {attention.map((t) => (
                <MaintenanceTaskCard key={t.id} task={t} variant="attention" onComplete={() => completeTask.mutate(t)} onClick={() => openEdit(t)} />
              ))}
            </Section>
          )}

          {inProgress.length > 0 && (
            <Section title="In Progress" count={inProgress.length} accentClass="text-violet-500">
              {inProgress.map((t) => (
                <MaintenanceTaskCard key={t.id} task={t} variant="upcoming" onComplete={() => completeTask.mutate(t)} onClick={() => openEdit(t)} />
              ))}
            </Section>
          )}

          <Section title="Upcoming" count={upcoming.length} accentClass="text-blue-500">
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground pl-6">No upcoming reminders</p>
            ) : (
              upcoming.map((t) => (
                <MaintenanceTaskCard key={t.id} task={t} variant="upcoming" onComplete={() => completeTask.mutate(t)} onClick={() => openEdit(t)} />
              ))
            )}
          </Section>

          {completed.length > 0 && (
            <Section title="Completed" count={completed.length} accentClass="text-emerald-500" defaultOpen={false}>
              {completed.map((t) => (
                <MaintenanceTaskCard key={t.id} task={t} variant="completed" onClick={() => openEdit(t)} />
              ))}
            </Section>
          )}
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Reminder' : 'Add Reminder'}</DialogTitle>
          </DialogHeader>
          <MaintenanceTaskForm task={editingTask} onClose={closeForm} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
