import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, parseISO, isPast, isToday } from 'date-fns';
import { icons } from 'lucide-react';
import { ArrowLeft, CheckCircle2, ChevronDown, ChevronRight, Circle, Package, Pencil, Plus, Repeat, Trash2 } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAssets, useDeleteAsset, useUpdateAsset } from '@/hooks/useAssets';
import { useAssetMaintenanceTasks, useCompleteMaintenanceTask } from '@/hooks/useMaintenanceTasks';
import { AssetCard } from '@/components/assets/AssetCard';
import { AssetForm } from '@/components/assets/AssetForm';
import { MaintenanceTaskForm } from '@/components/maintenance/MaintenanceTaskForm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import type { Asset } from '@/types/assets';
import { useEffect } from 'react';
import type { MaintenanceTask } from '@/types/maintenance';

function AssetTasksSection({ assetId, showOnKanban }: { assetId: string; showOnKanban: boolean }) {
  const { data: tasks = [] } = useAssetMaintenanceTasks(assetId);
  const completeTask = useCompleteMaintenanceTask();
  const updateAsset = useUpdateAsset();
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<MaintenanceTask | undefined>();
  const [completedOpen, setCompletedOpen] = useState(false);

  const pendingTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'needs_attention');
  const completedTasks = tasks.filter((t) => t.status === 'completed').slice(0, 10);

  const toggleKanban = (checked: boolean) => {
    updateAsset.mutate({ id: assetId, show_on_kanban: checked });
  };

  const openTaskAdd = () => { setEditingTask(undefined); setTaskFormOpen(true); };
  const openTaskEdit = (t: MaintenanceTask) => { setEditingTask(t); setTaskFormOpen(true); };

  return (
    <div className="pt-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Tasks</h2>
        <div className="flex items-center gap-2">
          <Switch id="kanban-toggle" checked={showOnKanban} onCheckedChange={toggleKanban} />
          <Label htmlFor="kanban-toggle" className="text-xs text-muted-foreground">Show on Kanban</Label>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Pending</h3>
        {pendingTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending tasks</p>
        ) : (
          pendingTasks.map((t) => {
            const isOverdue = t.nextDueDate && isPast(parseISO(t.nextDueDate)) && !isToday(parseISO(t.nextDueDate));
            return (
              <div
                key={t.id}
                className="flex items-center gap-3 rounded-lg border p-2 cursor-pointer hover:bg-accent/50"
                onClick={() => openTaskEdit(t)}
              >
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={(e) => { e.stopPropagation(); completeTask.mutate(t); }}>
                  <Circle className="h-5 w-5 text-muted-foreground" />
                </Button>
                <div className="flex-1 min-w-0 flex items-center gap-1.5">
                  <span className="text-sm truncate">{t.name}</span>
                  {t.recurrenceRule && <Repeat className="h-3 w-3 text-muted-foreground shrink-0" />}
                  {t.status === 'needs_attention' && <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />}
                </div>
                {t.nextDueDate && (
                  <span className={cn('text-xs whitespace-nowrap', isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground')}>
                    {format(parseISO(t.nextDueDate), 'MMM d')}
                  </span>
                )}
              </div>
            );
          })
        )}
        <Button variant="outline" size="sm" className="gap-1" onClick={openTaskAdd}>
          <Plus className="h-3 w-3" /> Add Reminder
        </Button>
      </div>

      {completedTasks.length > 0 && (
        <Collapsible open={completedOpen} onOpenChange={setCompletedOpen}>
          <CollapsibleTrigger className="flex items-center gap-2">
            <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', !completedOpen && '-rotate-90')} />
            <h3 className="text-sm font-medium text-muted-foreground">Completed ({completedTasks.length})</h3>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2">
            {completedTasks.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-lg border p-2 opacity-70 cursor-pointer hover:bg-accent/50" onClick={() => openTaskEdit(t)}>
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                <span className="text-sm truncate line-through text-muted-foreground flex-1">{t.name}</span>
                {t.dateCompleted && <span className="text-xs text-muted-foreground">{format(parseISO(t.dateCompleted), 'MMM d')}</span>}
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      <Dialog open={taskFormOpen} onOpenChange={setTaskFormOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Reminder' : 'Add Reminder'}</DialogTitle>
          </DialogHeader>
          <MaintenanceTaskForm task={editingTask} lockedAssetId={assetId} onClose={() => setTaskFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  // Convert kebab-case to PascalCase for lucide lookup
  const pascalName = name
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
  const Icon = (icons as Record<string, any>)[pascalName];
  if (!Icon) return null;
  return <Icon className={className} />;
}

export default function Assets() {
  usePageTitle('Assets');
  const { data: assets = [], isLoading } = useAssets();
  const deleteAsset = useDeleteAsset();

  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | undefined>(undefined);

  // Support deep-link editing via ?edit=id
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && !isLoading && assets.length > 0) {
      const found = assets.find((a) => a.id === editId);
      if (found) {
        setEditingAsset(found);
        setIsFormOpen(true);
      }
      searchParams.delete('edit');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, assets, isLoading]);

  const openAdd = () => {
    setEditingAsset(undefined);
    setIsFormOpen(true);
  };
  const openEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setIsFormOpen(true);
  };
  const closeForm = () => setIsFormOpen(false);

  const openDetail = (asset: Asset) => {
    setSelectedAsset(asset);
    setView('detail');
  };
  const backToList = () => {
    setView('list');
    setSelectedAsset(null);
  };

  const handleDelete = (id: string) => {
    deleteAsset.mutate(id, { onSuccess: backToList });
  };

  // Group assets by category
  const grouped = assets.reduce<Record<string, { name: string; icon: string | null; color: string | null; assets: Asset[] }>>((acc, asset) => {
    const key = asset.categoryName ?? 'Uncategorized';
    if (!acc[key]) {
      acc[key] = { name: key, icon: asset.categoryIcon ?? null, color: asset.categoryColor ?? null, assets: [] };
    }
    acc[key].assets.push(asset);
    return acc;
  }, {});
  const groups = Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name));

  // ── Detail View ──
  if (view === 'detail' && selectedAsset) {
    // Re-read from query cache so edits reflect
    const fresh = assets.find((a) => a.id === selectedAsset.id) ?? selectedAsset;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={backToList}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">{fresh.name}</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => openEdit(fresh)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Asset</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this asset? This will also delete all tasks linked to it.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(fresh.id)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {fresh.categoryName && (
          <Badge
            variant="secondary"
            style={{ backgroundColor: fresh.categoryColor ? `${fresh.categoryColor}20` : undefined, color: fresh.categoryColor ?? undefined }}
          >
            {fresh.categoryName}
          </Badge>
        )}

        <div className="space-y-4">
          {fresh.description && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <p className="text-foreground">{fresh.description}</p>
            </div>
          )}
          {fresh.purchaseDate && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Purchase Date</p>
              <p className="text-foreground">{format(parseISO(fresh.purchaseDate), 'MMMM d, yyyy')}</p>
            </div>
          )}
          {fresh.notes && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Notes</p>
              <p className="text-foreground whitespace-pre-wrap">{fresh.notes}</p>
            </div>
          )}
        </div>

        <AssetTasksSection assetId={fresh.id} showOnKanban={fresh.showOnKanban} />

        {/* Sheet for editing from detail */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAsset ? 'Edit Asset' : 'Add Asset'}</DialogTitle>
            </DialogHeader>
            <AssetForm asset={editingAsset} onClose={closeForm} />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ── List View ──
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Assets</h1>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add Asset
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : assets.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Package className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No assets yet. Add your first asset to get started.</p>
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add Asset
          </Button>
        </div>
      ) : (
        groups.map((group) => (
          <div key={group.name} className="space-y-2">
            <div className="flex items-center gap-2">
              {group.icon && (
                <DynamicIcon name={group.icon} className="h-4 w-4" />
              )}
              <h2
                className="text-sm font-semibold uppercase tracking-wide"
                style={{ color: group.color ?? undefined }}
              >
                {group.name}
              </h2>
            </div>
            <div className="space-y-2">
              {group.assets.map((asset) => (
                <AssetCard key={asset.id} asset={asset} onClick={() => openDetail(asset)} />
              ))}
            </div>
          </div>
        ))
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAsset ? 'Edit Asset' : 'Add Asset'}</DialogTitle>
          </DialogHeader>
          <AssetForm asset={editingAsset} onClose={closeForm} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
