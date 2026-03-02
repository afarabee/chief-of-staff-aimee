import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { CalendarCheck, CalendarDays, ChevronDown, Circle, CheckCircle2, ExternalLink, Pencil, RefreshCw } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAllMaintenanceEvents } from '@/hooks/useAllMaintenanceEvents';
import { useCompleteMaintenanceEvent } from '@/hooks/useMaintenanceTasks';
import { useSyncFromCalendar } from '@/hooks/useSyncFromCalendar';
import { useUpdateMaintenanceSuggestion } from '@/hooks/useUpdateMaintenanceSuggestion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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

function MaintenanceEventCard({
  event,
  onComplete,
  onEdit,
}: {
  event: MaintenanceEvent;
  onComplete: () => void;
  onEdit: () => void;
}) {
  const isCompleted = event.status === 'completed';

  return (
    <Card className={isCompleted ? 'opacity-60' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); if (!isCompleted) onComplete(); }}
            className={cn(
              'mt-0.5 shrink-0 transition-colors',
              isCompleted ? 'text-emerald-500' : 'text-muted-foreground hover:text-emerald-500'
            )}
            disabled={isCompleted}
          >
            {isCompleted ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <Circle className="h-5 w-5" />
            )}
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
                <Badge variant="outline" className="text-xs">
                  {event.providerName}
                </Badge>
              )}
              {event.lastCompleted && (
                <span className="text-xs text-muted-foreground">
                  Last done: {format(parseISO(event.lastCompleted), 'MMM d, yyyy')}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
              title="Edit task"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            {event.calendarLink && (
              <a
                href={event.calendarLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
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
  const completeMutation = useCompleteMaintenanceEvent();
  const syncMutation = useSyncFromCalendar();
  const updateMutation = useUpdateMaintenanceSuggestion();

  const [editState, setEditState] = useState<EditState | null>(null);

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
    completeMutation.mutate({ name: event.name, assetId: event.assetId });
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

    updateMutation.mutate(
      {
        enrichmentId: event.enrichmentId,
        suggestionIndex: event.suggestionIndex,
        updates: {
          suggestion: name.trim(),
          frequency,
          recommended_due_date: dueDate || null,
          provider_name: providerName.trim() || null,
        },
      },
      { onSuccess: () => setEditState(null) }
    );
  };

  const isEmpty = events.length === 0 && !isLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Maintenance</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => syncMutation.mutate({})}
          disabled={syncMutation.isPending}
        >
          <RefreshCw className={cn('h-4 w-4 mr-1.5', syncMutation.isPending && 'animate-spin')} />
          {syncMutation.isPending ? 'Syncing...' : 'Sync Calendar'}
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : isEmpty ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <CalendarCheck className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No maintenance events scheduled yet.</p>
          <p className="text-sm text-muted-foreground">Open an asset and click "Enrich with AI" to generate a maintenance schedule, then schedule events to Google Calendar.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {overdue.length > 0 && (
            <Section title="Overdue" count={overdue.length} accentClass="text-destructive">
              {overdue.map((e) => (
                <MaintenanceEventCard key={`${e.enrichmentId}-${e.suggestionIndex}`} event={e} onComplete={() => handleComplete(e)} onEdit={() => openEdit(e)} />
              ))}
            </Section>
          )}

          <Section title="Upcoming" count={upcoming.length} accentClass="text-blue-500">
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground pl-6">No upcoming maintenance</p>
            ) : (
              upcoming.map((e) => (
                <MaintenanceEventCard key={`${e.enrichmentId}-${e.suggestionIndex}`} event={e} onComplete={() => handleComplete(e)} onEdit={() => openEdit(e)} />
              ))
            )}
          </Section>

          {scheduled.length > 0 && (
            <Section title="Scheduled" count={scheduled.length} accentClass="text-muted-foreground">
              {scheduled.map((e) => (
                <MaintenanceEventCard key={`${e.enrichmentId}-${e.suggestionIndex}`} event={e} onComplete={() => handleComplete(e)} onEdit={() => openEdit(e)} />
              ))}
            </Section>
          )}

          {completed.length > 0 && (
            <Section title="Recently Completed" count={completed.length} accentClass="text-emerald-500" defaultOpen={false}>
              {completed.map((e) => (
                <MaintenanceEventCard key={`${e.enrichmentId}-${e.suggestionIndex}`} event={e} onComplete={() => handleComplete(e)} onEdit={() => openEdit(e)} />
              ))}
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
                      <SelectTrigger id="edit-unit">
                        <SelectValue />
                      </SelectTrigger>
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
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
