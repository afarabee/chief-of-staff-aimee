import { useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { icons } from 'lucide-react';
import { ArrowLeft, FileUp, Loader2, Package, Pencil, Plus, RefreshCw, Sparkles, Trash2 } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAssets, useDeleteAsset } from '@/hooks/useAssets';
import { AssetCard } from '@/components/assets/AssetCard';
import { AssetForm, type AssetInitialValues } from '@/components/assets/AssetForm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ResponsiveFormDialog } from '@/components/ui/responsive-dialog';
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
import { LinkedProvidersSection } from '@/components/links/LinkedProvidersSection';
import { useEnrichAndSave } from '@/hooks/useEnrichAndSave';
import { useAssetProviders } from '@/hooks/useAssetProviders';
import { useAssetEnrichment } from '@/hooks/useAssetEnrichment';
import { AssetSuggestionsSection } from '@/components/assets/AssetSuggestionsSection';
import { AssetAttachmentsReadonly } from '@/components/assets/AssetAttachments';
import { useSyncFromCalendar } from '@/hooks/useSyncFromCalendar';
import { useParseAssetDocument } from '@/hooks/useParseAssetDocument';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const pascalName = name.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('');
  const Icon = (icons as Record<string, any>)[pascalName];
  if (!Icon) return null;
  return <Icon className={className} />;
}

export default function Assets() {
  usePageTitle('Assets');
  const { data: assets = [], isLoading } = useAssets();
  const deleteAsset = useDeleteAsset();
  const navigate = useNavigate();

  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | undefined>(undefined);
  const [formInitialValues, setFormInitialValues] = useState<AssetInitialValues | undefined>(undefined);

  const scanInputRef = useRef<HTMLInputElement>(null);
  const parseMutation = useParseAssetDocument();
  const [isUploading, setIsUploading] = useState(false);
  const isScanningDoc = isUploading || parseMutation.isPending;

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

  const openAdd = () => { setEditingAsset(undefined); setFormInitialValues(undefined); setIsFormOpen(true); };
  const openEdit = (asset: Asset) => { setEditingAsset(asset); setFormInitialValues(undefined); setIsFormOpen(true); };
  const closeForm = () => { setIsFormOpen(false); setFormInitialValues(undefined); };

  const openDetail = (asset: Asset) => { setSelectedAsset(asset); setView('detail'); };
  const backToList = () => { setView('list'); setSelectedAsset(null); };

  const handleDelete = (id: string) => { deleteAsset.mutate(id, { onSuccess: backToList }); };

  const handleScanDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so re-selecting same file works
    e.target.value = '';

    try {
      setIsUploading(true);
      const ext = file.name.split('.').pop() || 'bin';
      const path = `scan-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('attachments').upload(path, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(path);
      const publicUrl = urlData.publicUrl;
      setIsUploading(false);

      const parsed = await parseMutation.mutateAsync(publicUrl);

      setEditingAsset(undefined);
      setFormInitialValues({
        name: parsed.name || '',
        description: parsed.description || '',
        purchaseDate: parsed.purchase_date || undefined,
        purchasePrice: parsed.purchase_price || undefined,
        notes: parsed.notes || '',
        categoryHint: parsed.category_hint || '',
        documentUrl: publicUrl,
        warrantyExpiryDate: parsed.warranty_expiry_date || undefined,
        warrantyNotes: parsed.warranty_notes || undefined,
      });
      setIsFormOpen(true);
    } catch (err) {
      setIsUploading(false);
      toast({ title: 'Scan failed', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
    }
  };

  const grouped = assets.reduce<Record<string, { name: string; icon: string | null; color: string | null; assets: Asset[] }>>((acc, asset) => {
    const key = asset.categoryName ?? 'Uncategorized';
    if (!acc[key]) acc[key] = { name: key, icon: asset.categoryIcon ?? null, color: asset.categoryColor ?? null, assets: [] };
    acc[key].assets.push(asset);
    return acc;
  }, {});
  const groups = Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name));

  const { enrich, isEnriching } = useEnrichAndSave();
  const activeAssetId = view === 'detail' && selectedAsset ? selectedAsset.id : undefined;
  const { data: linkedProviders = [] } = useAssetProviders(activeAssetId);
  const { data: assetEnrichment } = useAssetEnrichment(activeAssetId);
  const syncMutation = useSyncFromCalendar();

  const handleEnrichAsset = (asset: Asset) => {
    const providerNames = linkedProviders.map((p) => p.name).join(', ') || 'None';
    // Pull existing maintenance events from enrichment suggestions
    const scheduledNames = assetEnrichment?.suggestions
      ?.filter((s: any) => s.status === 'scheduled')
      ?.map((s: any) => s.suggestion)
      ?.join(', ') || 'None';
    enrich({
      itemType: 'asset',
      itemTitle: asset.name,
      itemId: asset.id,
      itemData: {
        name: asset.name,
        category: asset.categoryName || 'None',
        description: asset.description || '',
        notes: asset.notes || '',
        purchase_date: asset.purchaseDate || 'Unknown',
        linked_providers: providerNames,
        existing_tasks: scheduledNames,
      },
    });
  };

  if (view === 'detail' && selectedAsset) {
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
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={isEnriching}
              onClick={() => handleEnrichAsset(fresh)}
            >
              {isEnriching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isEnriching ? 'Enriching...' : 'Enrich with AI'}
            </Button>
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
          <Badge variant="secondary" style={{ backgroundColor: fresh.categoryColor ? `${fresh.categoryColor}20` : undefined, color: fresh.categoryColor ?? undefined }}>
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
          {(fresh.purchasePrice != null || fresh.currentValue != null) && (
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
              {fresh.purchasePrice != null && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Purchase Price</p>
                  <p className="text-foreground">${fresh.purchasePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              )}
              {fresh.currentValue != null && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Current Value</p>
                  <p className="text-foreground">${fresh.currentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              )}
            </div>
          )}
          {(fresh.warrantyExpiryDate || fresh.warrantyProvider || fresh.warrantyNotes) && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Warranty</p>
              {fresh.warrantyExpiryDate && (
                <p className="text-foreground">Expires: {format(parseISO(fresh.warrantyExpiryDate), 'MMMM d, yyyy')}</p>
              )}
              {fresh.warrantyProvider && (
                <p className="text-foreground">Provider: {fresh.warrantyProvider}</p>
              )}
              {fresh.warrantyNotes && (
                <p className="text-foreground text-sm">{fresh.warrantyNotes}</p>
              )}
            </div>
          )}
          {fresh.notes && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Notes</p>
              <p className="text-foreground whitespace-pre-wrap">{fresh.notes}</p>
            </div>
          )}
          {/* Multi-attachment display */}
          <AssetAttachmentsReadonly assetId={fresh.id} />
        </div>

        <LinkedProvidersSection assetId={fresh.id} onNavigateToProvider={(providerId) => navigate(`/providers?detail=${providerId}`)} />

        {/* Maintenance Schedule from AI Enrichment */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Maintenance Schedule</h2>
            {assetEnrichment && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => syncMutation.mutate({ assetId: fresh.id })}
                      disabled={syncMutation.isPending}
                    >
                      <RefreshCw className={`h-4 w-4 mr-1.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                      {syncMutation.isPending ? 'Syncing...' : 'Sync Calendar'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs text-center">
                    Pulls status from Google Calendar. If an event was deleted there, the task returns to unscheduled here. Nothing in Google Calendar is changed.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          {assetEnrichment ? (
            <AssetSuggestionsSection enrichment={assetEnrichment} assetName={fresh.name} assetId={fresh.id} />
          ) : (
            <p className="text-sm text-muted-foreground">No maintenance schedule yet. Click "Enrich with AI" to generate one.</p>
          )}
        </div>

        <ResponsiveFormDialog open={isFormOpen} onOpenChange={(open) => { if (!open) closeForm(); else setIsFormOpen(true); }} title={editingAsset ? 'Edit Asset' : formInitialValues ? 'Review Scanned Asset' : 'Add Asset'}>
          <AssetForm asset={editingAsset} onClose={closeForm} initialValues={formInitialValues} />
        </ResponsiveFormDialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">Assets</h1>
        <div className="flex gap-2">
          <input
            ref={scanInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            className="hidden"
            onChange={handleScanDocument}
          />
          <Button variant="outline" onClick={() => scanInputRef.current?.click()} disabled={isScanningDoc} className="flex-1 sm:flex-none">
            {isScanningDoc ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
            <span className="hidden sm:inline">{isScanningDoc ? 'Scanning…' : 'Scan Document'}</span>
            <span className="sm:hidden">{isScanningDoc ? 'Scanning…' : 'Scan'}</span>
          </Button>
          <Button onClick={openAdd} className="flex-1 sm:flex-none">
            <Plus className="h-4 w-4" />
            Add Asset
          </Button>
        </div>
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
              {group.icon && <DynamicIcon name={group.icon} className="h-4 w-4" />}
              <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: group.color ?? undefined }}>
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

      <ResponsiveFormDialog open={isFormOpen} onOpenChange={(open) => { if (!open) closeForm(); else setIsFormOpen(true); }} title={editingAsset ? 'Edit Asset' : formInitialValues ? 'Review Scanned Asset' : 'Add Asset'}>
        <AssetForm asset={editingAsset} onClose={closeForm} initialValues={formInitialValues} />
      </ResponsiveFormDialog>
    </div>
  );
}
