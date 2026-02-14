import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, DollarSign, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { ImageUpload } from '@/components/ui/image-upload';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useAssets, useCreateAsset } from '@/hooks/useAssets';
import { useProviders, useCreateProvider } from '@/hooks/useProviders';
import { useCreateMaintenanceTask, useUpdateMaintenanceTask } from '@/hooks/useMaintenanceTasks';
import { RECURRENCE_OPTIONS, RECURRENCE_UNITS, isPresetRecurrence } from '@/types/maintenance';
import type { MaintenanceTask } from '@/types/maintenance';

interface MaintenanceTaskFormProps {
  task?: MaintenanceTask;
  lockedAssetId?: string;
  lockedProviderId?: string;
  onClose: () => void;
}

export function MaintenanceTaskForm({ task, lockedAssetId, lockedProviderId, onClose }: MaintenanceTaskFormProps) {
  const isEdit = !!task;
  const [name, setName] = useState(task?.name ?? '');
  const [assetId, setAssetId] = useState<string>(lockedAssetId ?? task?.assetId ?? '');
  const [providerId, setProviderId] = useState<string>(lockedProviderId ?? task?.providerId ?? '');
  const [dueDate, setDueDate] = useState<Date | undefined>(
    task?.nextDueDate ? new Date(task.nextDueDate + 'T00:00:00') : isEdit ? undefined : new Date()
  );
  const existingRule = task?.recurrenceRule ?? '';
  const isCustom = existingRule && !isPresetRecurrence(existingRule);
  const [recurrenceSelect, setRecurrenceSelect] = useState(isCustom ? 'custom' : existingRule);
  const [customAmount, setCustomAmount] = useState(() => {
    if (isCustom) {
      const match = existingRule.match(/^(\d+)/);
      return match ? match[1] : '1';
    }
    return '1';
  });
  const [customUnit, setCustomUnit] = useState(() => {
    if (isCustom) {
      const match = existingRule.match(/([dmy])$/);
      return match ? match[1] : 'd';
    }
    return 'd';
  });

  const recurrence = recurrenceSelect === 'custom' ? `${customAmount}${customUnit}` : recurrenceSelect;
  const [status, setStatus] = useState(task?.status ?? 'pending');
  const [cost, setCost] = useState(task?.cost?.toString() ?? '');
  const [completedDate, setCompletedDate] = useState<Date | undefined>(
    task?.dateCompleted ? new Date(task.dateCompleted + 'T00:00:00') : undefined
  );
  const [notes, setNotes] = useState(task?.notes ?? '');
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(task?.attachmentUrl ?? null);
  const [showNewProvider, setShowNewProvider] = useState(false);
  const [newProviderName, setNewProviderName] = useState('');
  const [newProviderPhone, setNewProviderPhone] = useState('');
  const [newProviderEmail, setNewProviderEmail] = useState('');
  const [showNewAsset, setShowNewAsset] = useState(false);
  const [newAssetName, setNewAssetName] = useState('');

  const { data: assets = [] } = useAssets();
  const { data: providers = [] } = useProviders();
  const createTask = useCreateMaintenanceTask();
  const updateTask = useUpdateMaintenanceTask();
  const createProvider = useCreateProvider();
  const createAsset = useCreateAsset();
  const isPending = createTask.isPending || updateTask.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      name: name.trim(),
      asset_id: assetId || null,
      provider_id: providerId || null,
      next_due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : null,
      recurrence_rule: recurrence || null,
      status,
      cost: cost ? parseFloat(cost) : null,
      date_completed: status === 'completed' && completedDate ? format(completedDate, 'yyyy-MM-dd') : status === 'completed' ? format(new Date(), 'yyyy-MM-dd') : null,
      notes: notes.trim() || null,
      attachment_url: attachmentUrl,
    };

    if (isEdit) {
      updateTask.mutate({ id: task.id, ...payload }, { onSuccess: onClose });
    } else {
      createTask.mutate(payload, { onSuccess: onClose });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="task-name">Task Name *</Label>
        <Input id="task-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label>Asset</Label>
        {showNewAsset ? (
          <div className="space-y-2 rounded-md border border-border p-3">
            <div className="space-y-1">
              <Label htmlFor="new-asset-name" className="text-xs">Name *</Label>
              <Input id="new-asset-name" value={newAssetName} onChange={(e) => setNewAssetName(e.target.value)} placeholder="Asset name" />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                disabled={!newAssetName.trim() || createAsset.isPending}
                onClick={() => {
                  createAsset.mutate(
                    { name: newAssetName.trim() },
                    {
                      onSuccess: (data) => {
                        setAssetId(data.id);
                        setNewAssetName('');
                        setShowNewAsset(false);
                      },
                    }
                  );
                }}
              >
                {createAsset.isPending ? 'Saving…' : 'Save Asset'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setNewAssetName('');
                  setShowNewAsset(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Select value={assetId} onValueChange={setAssetId} disabled={!!lockedAssetId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an asset" />
              </SelectTrigger>
              <SelectContent>
                {assets.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!lockedAssetId && (
              <Button type="button" variant="ghost" size="sm" className="h-auto p-0 text-xs" onClick={() => setShowNewAsset(true)}>
                <Plus className="mr-1 h-3 w-3" />
                New Asset
              </Button>
            )}
          </>
        )}
      </div>

      <div className="space-y-2">
        <Label>Service Provider</Label>
        {showNewProvider ? (
          <div className="space-y-2 rounded-md border border-border p-3">
            <div className="space-y-1">
              <Label htmlFor="new-provider-name" className="text-xs">Name *</Label>
              <Input id="new-provider-name" value={newProviderName} onChange={(e) => setNewProviderName(e.target.value)} placeholder="Provider name" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-provider-phone" className="text-xs">Phone</Label>
              <Input id="new-provider-phone" value={newProviderPhone} onChange={(e) => setNewProviderPhone(e.target.value)} placeholder="Phone number" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-provider-email" className="text-xs">Email</Label>
              <Input id="new-provider-email" type="email" value={newProviderEmail} onChange={(e) => setNewProviderEmail(e.target.value)} placeholder="Email address" />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                disabled={!newProviderName.trim() || createProvider.isPending}
                onClick={() => {
                  createProvider.mutate(
                    {
                      name: newProviderName.trim(),
                      phone: newProviderPhone.trim() || null,
                      email: newProviderEmail.trim() || null,
                    },
                    {
                      onSuccess: (data) => {
                        setProviderId(data.id);
                        setNewProviderName('');
                        setNewProviderPhone('');
                        setNewProviderEmail('');
                        setShowNewProvider(false);
                      },
                    }
                  );
                }}
              >
                {createProvider.isPending ? 'Saving…' : 'Save Provider'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setNewProviderName('');
                  setNewProviderPhone('');
                  setNewProviderEmail('');
                  setShowNewProvider(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Select value={providerId} onValueChange={setProviderId} disabled={!!lockedProviderId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!lockedProviderId && (
              <Button type="button" variant="ghost" size="sm" className="h-auto p-0 text-xs" onClick={() => setShowNewProvider(true)}>
                <Plus className="mr-1 h-3 w-3" />
                New Provider
              </Button>
            )}
          </>
        )}
      </div>

      <div className="space-y-2">
        <Label>Due Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn('w-full justify-start text-left font-normal', !dueDate && 'text-muted-foreground')}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dueDate ? format(dueDate, 'PPP') : 'Pick a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus className="p-3 pointer-events-auto" />
            {dueDate && (
              <div className="border-t border-border p-2">
                <Button type="button" variant="ghost" size="sm" className="w-full text-xs" onClick={() => setDueDate(undefined)}>
                  Clear date
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label>Recurrence</Label>
        <Select value={recurrenceSelect} onValueChange={setRecurrenceSelect}>
          <SelectTrigger>
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent>
            {RECURRENCE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value || 'none'} value={opt.value || 'none'}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {recurrenceSelect === 'custom' && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Every</span>
            <Input
              type="number"
              min="1"
              className="w-20"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
            />
            <Select value={customUnit} onValueChange={setCustomUnit}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RECURRENCE_UNITS.map((u) => (
                  <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="needs_attention">Needs Attention</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="task-cost">Cost</Label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="task-cost"
            type="number"
            step="0.01"
            min="0"
            className="pl-8"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
          />
        </div>
      </div>

      {status === 'completed' && (
        <div className="space-y-2">
          <Label>Completed Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn('w-full justify-start text-left font-normal', !completedDate && 'text-muted-foreground')}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {completedDate ? format(completedDate, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={completedDate} onSelect={setCompletedDate} initialFocus className="p-3 pointer-events-auto" />
              {completedDate && (
                <div className="border-t border-border p-2">
                  <Button type="button" variant="ghost" size="sm" className="w-full text-xs" onClick={() => setCompletedDate(undefined)}>
                    Clear date
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="task-notes">Notes</Label>
        <Textarea id="task-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
      </div>

      <div className="space-y-2">
        <Label>Attachment</Label>
        <ImageUpload value={attachmentUrl} onChange={setAttachmentUrl} />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={isPending || !name.trim()}>
          {isPending ? 'Saving…' : 'Save'}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
