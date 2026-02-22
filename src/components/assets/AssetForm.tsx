import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, Sparkles, Trash2 } from 'lucide-react';
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
import { useAssetCategories, useCreateAsset, useUpdateAsset, useDeleteAsset } from '@/hooks/useAssets';
import { useEnrichAndSave } from '@/hooks/useEnrichAndSave';
import { supabase } from '@/integrations/supabase/client';
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

  const { data: categories = [] } = useAssetCategories();
  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();
  const deleteAssetMutation = useDeleteAsset();
  const { enrich, isEnriching } = useEnrichAndSave();
  const isPending = createAsset.isPending || updateAsset.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      name: name.trim(),
      category_id: categoryId || null,
      description: description.trim() || null,
      purchase_date: purchaseDate ? format(purchaseDate, 'yyyy-MM-dd') : null,
      notes: notes.trim() || null,
    };

    if (isEdit) {
      updateAsset.mutate({ id: asset.id, ...payload }, { onSuccess: onClose });
    } else {
      createAsset.mutate(payload, { onSuccess: onClose });
    }
  };

  return (
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

      <div className="space-y-2">
        <Label htmlFor="asset-notes">Notes</Label>
        <Textarea id="asset-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        disabled={isEnriching || !name.trim()}
        onClick={() => {
          const categoryObj = categories.find((c) => c.id === categoryId);
          const itemData = {
            name: name.trim(),
            description: description.trim() || null,
            category: categoryObj?.name || null,
            purchase_date: purchaseDate ? format(purchaseDate, 'yyyy-MM-dd') : null,
            notes: notes.trim() || null,
          };
          enrich({
            itemType: 'asset',
            itemTitle: name.trim(),
            itemData,
            itemId: asset?.id,
            onSaveNew: async () => {
              const payload = {
                name: name.trim(),
                category_id: categoryId || null,
                description: description.trim() || null,
                purchase_date: purchaseDate ? format(purchaseDate, 'yyyy-MM-dd') : null,
                notes: notes.trim() || null,
              };
              const { data, error } = await supabase
                .from('assets')
                .insert(payload)
                .select('id')
                .single();
              if (error) throw error;
              return data.id;
            },
            onSaveExisting: async () => {
              if (asset) {
                updateAsset.mutate({
                  id: asset.id,
                  name: name.trim(),
                  category_id: categoryId || null,
                  description: description.trim() || null,
                  purchase_date: purchaseDate ? format(purchaseDate, 'yyyy-MM-dd') : null,
                  notes: notes.trim() || null,
                });
              }
            },
            onClose,
          });
        }}
      >
        {isEnriching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {isEnriching ? 'Enriching...' : 'Enrich with AI'}
      </Button>

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
  );
}
