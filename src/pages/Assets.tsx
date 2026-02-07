import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { icons } from 'lucide-react';
import { ArrowLeft, ChevronRight, Package, Pencil, Plus, Trash2 } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAssets, useDeleteAsset } from '@/hooks/useAssets';
import { AssetCard } from '@/components/assets/AssetCard';
import { AssetForm } from '@/components/assets/AssetForm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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

        <div className="pt-4">
          <h2 className="text-lg font-semibold text-foreground">Tasks</h2>
          <p className="text-sm text-muted-foreground">Task management coming soon.</p>
        </div>

        {/* Sheet for editing from detail */}
        <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{editingAsset ? 'Edit Asset' : 'Add Asset'}</SheetTitle>
            </SheetHeader>
            <AssetForm asset={editingAsset} onClose={closeForm} />
          </SheetContent>
        </Sheet>
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

      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingAsset ? 'Edit Asset' : 'Add Asset'}</SheetTitle>
          </SheetHeader>
          <AssetForm asset={editingAsset} onClose={closeForm} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
