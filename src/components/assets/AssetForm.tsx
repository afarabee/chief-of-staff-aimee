import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Trash2, Plus } from 'lucide-react';
import { AssetAttachments } from '@/components/assets/AssetAttachments';
import { ImageUpload } from '@/components/ui/image-upload';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAssetCategories, useCreateAsset, useUpdateAsset, useDeleteAsset } from '@/hooks/useAssets';
import { useProviders, useCreateProvider } from '@/hooks/useProviders';
import { useLinkAssetProvider } from '@/hooks/useAssetProviders';
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
import { toast } from '@/hooks/use-toast';
import type { Asset } from '@/types/assets';

interface AssetFormProps {
  asset?: Asset;
  onClose: () => void;
}

export function AssetForm({ asset, onClose }: AssetFormProps) {
  const isEdit = !!asset;
  const [name, setName] = useState(asset?.name ?? '');
  const [categoryId, setCategoryId] = useState<string>(asset?.categoryId ?? '');
  const [description, setDescription] = useState(asset?.description ?? '');
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(
    asset?.purchaseDate ? new Date(asset.purchaseDate + 'T00:00:00') : undefined
  );
  const [notes, setNotes] = useState(asset?.notes ?? '');
  
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');

  // New provider dialog state
  const [showNewProvider, setShowNewProvider] = useState(false);
  const [newProviderName, setNewProviderName] = useState('');
  const [newProviderCategoryId, setNewProviderCategoryId] = useState('');
  const [newProviderPhone, setNewProviderPhone] = useState('');
  const [newProviderEmail, setNewProviderEmail] = useState('');
  const [newProviderNotes, setNewProviderNotes] = useState('');

  const { data: categories = [] } = useAssetCategories();
  const { data: providers = [] } = useProviders();
  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();
  const deleteAssetMutation = useDeleteAsset();
  const createProvider = useCreateProvider();
  const linkMutation = useLinkAssetProvider();
  const isPending = createAsset.isPending || updateAsset.isPending;

  const handleProviderChange = (value: string) => {
    if (value === '__new__') {
      setShowNewProvider(true);
    } else {
      setSelectedProviderId(value === '__none__' ? '' : value);
    }
  };

  const handleCreateProvider = async () => {
    if (!newProviderName.trim()) return;
    try {
      const result = await createProvider.mutateAsync({
        name: newProviderName.trim(),
        category_id: newProviderCategoryId || null,
        phone: newProviderPhone.trim() || null,
        email: newProviderEmail.trim() || null,
        notes: newProviderNotes.trim() || null,
      });
      setSelectedProviderId(result.id);
      setShowNewProvider(false);
      setNewProviderName('');
      setNewProviderCategoryId('');
      setNewProviderPhone('');
      setNewProviderEmail('');
      setNewProviderNotes('');
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      name: name.trim(),
      category_id: categoryId || null,
      description: description.trim() || null,
      purchase_date: purchaseDate ? format(purchaseDate, 'yyyy-MM-dd') : null,
      notes: notes.trim() || null,
      attachment_url: null,
    };

    if (isEdit) {
      updateAsset.mutate({ id: asset.id, ...payload }, { onSuccess: onClose });
    } else {
      createAsset.mutate(payload, {
        onSuccess: (data) => {
          if (selectedProviderId && data?.id) {
            linkMutation.mutate(
              { assetId: data.id, providerId: selectedProviderId },
              {
                onSuccess: () => {
                  toast({ title: 'Provider linked to asset' });
                },
              }
            );
          }
          onClose();
        },
      });
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="asset-name">Name *</Label>
          <Input id="asset-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="asset-description">Description</Label>
          <Input id="asset-description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>Purchase Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn('w-full justify-start text-left font-normal', !purchaseDate && 'text-muted-foreground')}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {purchaseDate ? format(purchaseDate, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={purchaseDate}
                onSelect={setPurchaseDate}
                initialFocus
                className="p-3 pointer-events-auto"
              />
              {purchaseDate && (
                <div className="border-t border-border p-2">
                  <Button type="button" variant="ghost" size="sm" className="w-full text-xs" onClick={() => setPurchaseDate(undefined)}>
                    Clear date
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {!isEdit && (
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select value={selectedProviderId || '__none__'} onValueChange={handleProviderChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {providers.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}{p.categoryName ? ` — ${p.categoryName}` : ''}
                  </SelectItem>
                ))}
                <SelectItem value="__new__">
                  <span className="flex items-center gap-1">
                    <Plus className="h-3 w-3" /> New Provider
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label>Attachments {isEdit ? '' : '(available after saving)'}</Label>
          {isEdit ? (
            <AssetAttachments assetId={asset!.id} />
          ) : (
            <p className="text-sm text-muted-foreground">Save the asset first, then add attachments.</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="asset-notes">Notes</Label>
          <Textarea id="asset-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </div>

        <div className="flex justify-between pt-2">
          {isEdit && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Asset?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete "{asset!.name}". This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      deleteAssetMutation.mutate(asset!.id, { onSuccess: onClose });
                    }}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <div className="flex gap-2 ml-auto">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </form>

      <Dialog open={showNewProvider} onOpenChange={setShowNewProvider}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Provider</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={newProviderName} onChange={(e) => setNewProviderName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={newProviderCategoryId} onValueChange={setNewProviderCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={newProviderPhone} onChange={(e) => setNewProviderPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={newProviderEmail} onChange={(e) => setNewProviderEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={newProviderNotes} onChange={(e) => setNewProviderNotes(e.target.value)} rows={2} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowNewProvider(false)}>Cancel</Button>
              <Button onClick={handleCreateProvider} disabled={!newProviderName.trim() || createProvider.isPending}>
                {createProvider.isPending ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
