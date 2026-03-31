import { useState, useMemo } from 'react';
import { generateTitle } from '@/utils/generateTitle';
import { format, parseISO } from 'date-fns';
import { CalendarCheck, CalendarDays, CalendarPlus, ChevronDown, Circle, CheckCircle2, ExternalLink, Loader2, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAllMaintenanceEvents } from '@/hooks/useAllMaintenanceEvents';
import { useCompleteMaintenanceEvent, useDeleteMaintenanceEvent, useUpdateDirectTask } from '@/hooks/useMaintenanceTasks';
import { useSyncFromCalendar } from '@/hooks/useSyncFromCalendar';
import { useUpdateMaintenanceSuggestion } from '@/hooks/useUpdateMaintenanceSuggestion';
import { useScheduleToCalendar } from '@/hooks/useScheduleToCalendar';
import { useBulkScheduleToCalendar } from '@/hooks/useBulkScheduleToCalendar';
import { useProviders } from '@/hooks/useProviders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { frequencyToLabel, FREQUENCY_PRESETS } from '@/utils/frequency';
import type { MaintenanceEvent } from '@/types/maintenance';

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

interface CardProps {
  event: MaintenanceEvent;
  onComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onScheduleOpen: () => void;
  isScheduling: boolean;
  schedulingProviderId: string;
  schedulingTime: string;
  schedulingReminder: number;
  onProviderChange: (id: string) => void;
  onTimeChange: (time: string) => void;
  onReminderChange: (reminder: number) => void;
  onScheduleConfirm: () => void;
  onScheduleCancel: () => void;
  isSchedulePending: boolean;
  allProviders: { id: string; name: string }[];
}

const REMINDER_OPTIONS = [
  { value: 0, label: 'At time of event' },
  { value: 5, label: '5 min before' },
  { value: 15, label: '15 min before' },
  { value: 30, label: '30 min before' },
  { value: 60, label: '1 hour before' },
  { value: 1440, label: '1 day before' },
];

function MaintenanceEventCard({
  event,
  onComplete,
  onEdit,
  onDelete,
  onScheduleOpen,
  isScheduling,
  schedulingProviderId,
  schedulingTime,
  schedulingReminder,
  onProviderChange,
  onTimeChange,
  onReminderChange,
  onScheduleConfirm,
  onScheduleCancel,
  isSchedulePending,
  allProviders,
}: CardProps) {
  const isCompleted = event.status === 'completed';

  return (
    <Card className={isCompleted ? 'opacity-60' : ''}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); if (!isCompleted) onComplete(); }}
            className={cn(
              'mt-0.5 shrink-0 transition-colors',
              isCompleted ? 'text-emerald-500' : 'text-muted-foreground hover:text-emerald-500'
            )}
            disabled={isCompleted}
          >
            {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
          </button>

          <div className="flex-1 min-w-0 space-y-1">
            <p className={cn('text-sm font-semibold', isCompleted && 'line-through text-muted-foreground')}>
              {event.name}
            </p>
            <p className="text-xs text-muted-foreground">{event.assetName}</p>
            {event.bundledItems && event.bundledItems.length > 0 && (
              <ul className="ml-1 space-y-0.5 mt-1">
                {event.bundledItems.map((item, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-muted-foreground shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap items-center gap-2">
              {event.frequency && (
                <Badge variant="secondary" className="text-xs">
                  {frequencyToLabel(event.frequency as any)}
                </Badge>
              )}
              {event.nextDueDate && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {format(parseISO(event.nextDueDate), 'MMM d, yyyy')}
                </span>
              )}
              {event.providerName && (
                <Badge variant="outline" className="text-xs">{event.providerName}</Badge>
              )}
              {event.lastCompleted && (
                <span className="text-xs text-muted-foreground">
                  Last done: {format(parseISO(event.lastCompleted), 'MMM d, yyyy')}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {!isCompleted && !event.calendarEventId && (
              <button
                onClick={(e) => { e.stopPropagation(); onScheduleOpen(); }}
                className="text-muted-foreground hover:text-blue-500 transition-colors p-1"
                title="Schedule to Google Calendar"
              >
                <CalendarPlus className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
              title="Edit task"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1"
                  title="Delete task"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Maintenance Task</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove this maintenance task. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            {event.calendarLink && (
              <a
                href={event.calendarLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 p-1"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        {isScheduling && (
          <div className="rounded-md border p-3 bg-muted/30 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Schedule to Google Calendar</p>
            <Select value={schedulingProviderId} onValueChange={onProviderChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Link a provider (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No provider</SelectItem>
                {allProviders.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Time</label>
                <Input type="time" value={schedulingTime} onChange={(e) => onTimeChange(e.target.value)} className="h-8" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Reminder</label>
                <Select value={String(schedulingReminder)} onValueChange={(v) => onReminderChange(Number(v))}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REMINDER_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="gap-1.5"
                onClick={onScheduleConfirm}
                disabled={isSchedulePending}
              >
                {isSchedulePending
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <CalendarPlus className="h-3.5 w-3.5" />}
                {isSchedulePending ? 'Scheduling...' : 'Confirm'}
              </Button>
              <Button size="sm" variant="ghost" onClick={onScheduleCancel}>Cancel</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface EditState {
  event: MaintenanceEvent;
  name: string;
  frequencyKey: string;
  customInterval: string;
  customUnit: string;
  dueDate: string;
  providerName: string;
}

export default function Maintenance() {
  usePageTitle('Maintenance');
  const { data: events = [], isLoading } = useAllMaintenanceEvents();
  const { data: allProviders = [] } = useProviders();
  const completeMutation = useCompleteMaintenanceEvent();
  const deleteMutation = useDeleteMaintenanceEvent();
  const syncMutation = useSyncFromCalendar();
  const updateMutation = useUpdateMaintenanceSuggestion();
  const updateDirectTask = useUpdateDirectTask();
  const scheduleMutation = useScheduleToCalendar();
  const bulkScheduleMutation = useBulkScheduleToCalendar();

  const [editState, setEditState] = useState<EditState | null>(null);
  const [schedulingKey, setSchedulingKey] = useState<string | null>(null);
  const [schedulingProviderId, setSchedulingProviderId] = useState('none');
  const [schedulingTime, setSchedulingTime] = useState('09:00');
  const [schedulingReminder, setSchedulingReminder] = useState(30);
  const [seriesChoice, setSeriesChoice] = useState<'pending' | null>(null);
  const [pendingSaveData, setPendingSaveData] = useState<{
    event: MaintenanceEvent;
    name: string;
    frequency: { interval: number; unit: string } | null;
    dueDate: string;
    providerName: string;
  } | null>(null);

  const { overdue, upcoming, scheduled, completed } = useMemo(() => {
    const overdue: MaintenanceEvent[] = [];
    const upcoming: MaintenanceEvent[] = [];
    const scheduled: MaintenanceEvent[] = [];
    const completed: MaintenanceEvent[] = [];
    events.forEach((e) => {
      switch (e.status) {
        case 'overdue': overdue.push(e); break;
        case 'upcoming': upcoming.push(e); break;
        case 'completed': completed.push(e); break;
        default: scheduled.push(e);
      }
    });
    return { overdue, upcoming, scheduled, completed };
  }, [events]);

  const handleComplete = (event: MaintenanceEvent) => {
    completeMutation.mutate({ name: event.name, assetId: event.assetId, taskId: event.taskId });
  };

  const handleDelete = (event: MaintenanceEvent) => {
    deleteMutation.mutate({ enrichmentId: event.enrichmentId, suggestionIndex: event.suggestionIndex, taskId: event.taskId });
  };

  const openEdit = (event: MaintenanceEvent) => {
    const freq = event.frequency;
    const presetIdx = freq
      ? FREQUENCY_PRESETS.findIndex(p => p.value.interval === freq.interval && p.value.unit === freq.unit)
      : -1;
    setEditState({
      event,
      name: event.name,
      frequencyKey: presetIdx >= 0 ? String(presetIdx) : (freq ? 'custom' : 'none'),
      customInterval: freq ? String(freq.interval) : '1',
      customUnit: freq ? freq.unit : 'months',
      dueDate: event.nextDueDate || event.recommendedDueDate || '',
      providerName: event.providerName || '',
    });
  };

  const handleSave = () => {
    if (!editState) return;
    const { event, name, frequencyKey, customInterval, customUnit, dueDate, providerName } = editState;
    let frequency: { interval: number; unit: string } | null = null;
    if (frequencyKey === 'custom') {
      frequency = { interval: parseInt(customInterval) || 1, unit: customUnit };
    } else if (frequencyKey !== 'none') {
      frequency = FREQUENCY_PRESETS[parseInt(frequencyKey)]?.value ?? null;
    }

    const originalDueDate = event.nextDueDate || event.recommendedDueDate || '';
    const isRecurring = frequencyKey !== 'none';
    const dateChanged = dueDate !== originalDueDate;

    if (isRecurring && dateChanged) {
      setPendingSaveData({ event, name, frequency, dueDate, providerName });
      setSeriesChoice('pending');
      return;
    }

    executeSave({ event, name, frequency, dueDate, providerName, mode: 'all' });
  };

  const executeSave = ({ event, name, frequency, dueDate, providerName, mode }: {
    event: MaintenanceEvent;
    name: string;
    frequency: { interval: number; unit: string } | null;
    dueDate: string;
    providerName: string;
    mode: 'single' | 'all';
  }) => {
    if (event.taskId) {
      const unitMap: Record<string, string> = { days: 'd', weeks: 'w', months: 'm', years: 'y' };
      const updates: Record<string, any> = { next_due_date: dueDate || null };
      if (mode === 'all') {
        updates.name = name.trim();
        updates.recurrence_rule = frequency ? `${frequency.interval}${unitMap[frequency.unit] || 'm'}` : null;
      }
      updateDirectTask.mutate(
        { taskId: event.taskId, updates },
        { onSuccess: () => { setEditState(null); setSeriesChoice(null); setPendingSaveData(null); } }
      );
    } else {
      if (mode === 'single') {
        updateMutation.mutate(
          {
            enrichmentId: event.enrichmentId,
            suggestionIndex: event.suggestionIndex,
            calendarEventId: event.calendarEventId,
            updates: { recommended_due_date: dueDate || null },
          },
          { onSuccess: () => { setEditState(null); setSeriesChoice(null); setPendingSaveData(null); } }
        );
      } else {
        updateMutation.mutate(
          {
            enrichmentId: event.enrichmentId,
            suggestionIndex: event.suggestionIndex,
            calendarEventId: event.calendarEventId,
            updates: {
              suggestion: name.trim(),
              frequency,
              recommended_due_date: dueDate || null,
              provider_name: providerName.trim() || null,
            },
          },
          { onSuccess: () => { setEditState(null); setSeriesChoice(null); setPendingSaveData(null); } }
        );
      }
    }
  };

  const handleSeriesConfirm = (choice: 'single' | 'all') => {
    if (!pendingSaveData) return;
    executeSave({ ...pendingSaveData, mode: choice });
  };

  const openSchedule = (event: MaintenanceEvent) => {
    setSchedulingKey(`${event.enrichmentId}-${event.suggestionIndex}`);
    setSchedulingProviderId('none');
    setSchedulingTime('09:00');
    setSchedulingReminder(30);
  };

  const handleScheduleConfirm = async (event: MaintenanceEvent) => {
    const provider = schedulingProviderId !== 'none'
      ? allProviders.find((p) => p.id === schedulingProviderId)
      : null;

    let description = `Asset: ${event.assetName}`;
    if (provider) description += `\nProvider: ${provider.name}`;
    if (event.bundledItems && event.bundledItems.length > 0) {
      description += `\n\nMaintenance checklist:\n${event.bundledItems.map(i => `- ${i}`).join('\n')}`;
    }

    await scheduleMutation.mutateAsync({
      enrichmentId: event.enrichmentId,
      suggestionIndex: event.suggestionIndex,
      summary: `${event.assetName}: ${generateTitle(event.name)}`,
      description,
      startDate: event.nextDueDate || event.recommendedDueDate || new Date().toISOString().split('T')[0],
      frequency: event.frequency ?? undefined,
      providerName: provider?.name,
      providerId: provider?.id,
      startTime: schedulingTime,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      reminders: [schedulingReminder],
    });

    setSchedulingKey(null);
    setSchedulingProviderId('none');
  };

  const isEmpty = events.length === 0 && !isLoading;

  const renderCard = (e: MaintenanceEvent) => {
    const key = e.taskId ? `task-${e.taskId}` : `${e.enrichmentId}-${e.suggestionIndex}`;
    return (
      <MaintenanceEventCard
        key={key}
        event={e}
        onComplete={() => handleComplete(e)}
        onEdit={() => openEdit(e)}
        onDelete={() => handleDelete(e)}
        onScheduleOpen={() => openSchedule(e)}
        isScheduling={schedulingKey === key}
        schedulingProviderId={schedulingProviderId}
        schedulingTime={schedulingTime}
        schedulingReminder={schedulingReminder}
        onProviderChange={setSchedulingProviderId}
        onTimeChange={setSchedulingTime}
        onReminderChange={setSchedulingReminder}
        onScheduleConfirm={() => handleScheduleConfirm(e)}
        onScheduleCancel={() => setSchedulingKey(null)}
        isSchedulePending={scheduleMutation.isPending}
        allProviders={allProviders}
      />
    );
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Maintenance</h1>
          <div className="flex items-center gap-2">
            {events.length > 0 && (() => {
              const unscheduled = events.filter(e => !e.calendarEventId && e.status !== 'completed');
              const allDone = unscheduled.length === 0;
              return (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => bulkScheduleMutation.mutate(unscheduled)}
                  disabled={bulkScheduleMutation.isPending || allDone}
                >
                  {bulkScheduleMutation.isPending
                    ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    : allDone
                      ? <CalendarCheck className="h-4 w-4 mr-1.5 text-emerald-500" />
                      : <CalendarPlus className="h-4 w-4 mr-1.5" />}
                  {bulkScheduleMutation.isPending ? 'Scheduling...' : allDone ? 'All Scheduled' : `Schedule All (${unscheduled.length})`}
                </Button>
              );
            })()}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => syncMutation.mutate({})}
                  disabled={syncMutation.isPending}
                >
                  <RefreshCw className={cn('h-4 w-4 mr-1.5', syncMutation.isPending && 'animate-spin')} />
                  {syncMutation.isPending ? 'Syncing...' : 'Sync Calendar'}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs text-center">
                Pulls status from Google Calendar. If an event was deleted there, the task returns to unscheduled here. Nothing in Google Calendar is changed.
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : isEmpty ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <CalendarCheck className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No maintenance events scheduled yet.</p>
            <p className="text-sm text-muted-foreground">Open an asset and click "Enrich with AI" to generate a maintenance schedule.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {overdue.length > 0 && (
              <Section title="Overdue" count={overdue.length} accentClass="text-destructive">
                {overdue.map(renderCard)}
              </Section>
            )}
            <Section title="Upcoming" count={upcoming.length} accentClass="text-blue-500">
              {upcoming.length === 0
                ? <p className="text-sm text-muted-foreground pl-6">No upcoming maintenance</p>
                : upcoming.map(renderCard)}
            </Section>
            {scheduled.length > 0 && (
              <Section title="Scheduled" count={scheduled.length} accentClass="text-muted-foreground">
                {scheduled.map(renderCard)}
              </Section>
            )}
            {completed.length > 0 && (
              <Section title="Recently Completed" count={completed.length} accentClass="text-emerald-500" defaultOpen={false}>
                {completed.map(renderCard)}
              </Section>
            )}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editState} onOpenChange={(open) => { if (!open) setEditState(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Maintenance Task</DialogTitle>
            </DialogHeader>
            {editState && (
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-name">Task Name</Label>
                  <Input
                    id="edit-name"
                    value={editState.name}
                    onChange={(e) => setEditState({ ...editState, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-frequency">Frequency</Label>
                  <Select
                    value={editState.frequencyKey}
                    onValueChange={(val) => setEditState({ ...editState, frequencyKey: val })}
                  >
                    <SelectTrigger id="edit-frequency">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No recurrence</SelectItem>
                      {FREQUENCY_PRESETS.map((p, i) => (
                        <SelectItem key={i} value={String(i)}>{p.label}</SelectItem>
                      ))}
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {editState.frequencyKey === 'custom' && (
                  <div className="flex gap-2">
                    <div className="space-y-1.5 w-24">
                      <Label htmlFor="edit-interval">Every</Label>
                      <Input
                        id="edit-interval"
                        type="number"
                        min={1}
                        value={editState.customInterval}
                        onChange={(e) => setEditState({ ...editState, customInterval: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <Label htmlFor="edit-unit">Unit</Label>
                      <Select
                        value={editState.customUnit}
                        onValueChange={(val) => setEditState({ ...editState, customUnit: val })}
                      >
                        <SelectTrigger id="edit-unit"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="days">Days</SelectItem>
                          <SelectItem value="weeks">Weeks</SelectItem>
                          <SelectItem value="months">Months</SelectItem>
                          <SelectItem value="years">Years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="edit-due">Next Due Date</Label>
                  <Input
                    id="edit-due"
                    type="date"
                    value={editState.dueDate}
                    onChange={(e) => setEditState({ ...editState, dueDate: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-provider">Provider</Label>
                  <Input
                    id="edit-provider"
                    value={editState.providerName}
                    placeholder="Optional"
                    onChange={(e) => setEditState({ ...editState, providerName: e.target.value })}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditState(null)}>Cancel</Button>
              <Button onClick={handleSave} disabled={updateMutation.isPending || updateDirectTask.isPending}>
                {(updateMutation.isPending || updateDirectTask.isPending) ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Series choice AlertDialog */}
        <AlertDialog open={seriesChoice === 'pending'} onOpenChange={(open) => { if (!open) { setSeriesChoice(null); setPendingSaveData(null); } }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Update recurring task</AlertDialogTitle>
              <AlertDialogDescription>
                Do you want to change just this occurrence, or all future occurrences?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button variant="outline" onClick={() => handleSeriesConfirm('single')}>
                Just this one
              </Button>
              <Button onClick={() => handleSeriesConfirm('all')}>
                All future tasks
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
