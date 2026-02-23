import { useState } from 'react';
import { Link, X, Plus } from 'lucide-react';
import { useAssetProviders, useLinkAssetProvider, useUnlinkAssetProvider } from '@/hooks/useAssetProviders';
import { useProviders, useCreateProvider } from '@/hooks/useProviders';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  assetId: string;
  onNavigateToProvider?: (providerId: string) => void;
}

function useAssetCategories() {
  return useQuery({
    queryKey: ['asset-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, icon, color')
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function LinkedProvidersSection({ assetId, onNavigateToProvider }: Props) {
  const { data: linkedProviders = [] } = useAssetProviders(assetId);
  const { data: allProviders = [] } = useProviders();
  const linkMutation = useLinkAssetProvider();
  const unlinkMutation = useUnlinkAssetProvider();
  const createProvider = useCreateProvider();
  const { data: categories = [] } = useAssetCategories();
  const [isAdding, setIsAdding] = useState(false);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newForm, setNewForm] = useState({ name: '', category_id: '', phone: '', email: '', notes: '' });

  const linkedIds = new Set(linkedProviders.map((p) => p.id));
  const available = allProviders.filter((p) => !linkedIds.has(p.id));

  const handleLink = (providerId: string) => {
    if (providerId === '__new__') {
      setShowNewDialog(true);
      setIsAdding(false);
      return;
    }
    linkMutation.mutate({ assetId, providerId });
    setIsAdding(false);
  };

  const handleUnlink = (providerId: string) => {
    unlinkMutation.mutate({ assetId, providerId });
  };

  const handleCreateAndLink = async () => {
    if (!newForm.name.trim()) return;
    try {
      const result = await createProvider.mutateAsync({
        name: newForm.name.trim(),
        category_id: newForm.category_id || null,
        phone: newForm.phone || null,
        email: newForm.email || null,
        notes: newForm.notes || null,
      });
      await linkMutation.mutateAsync({ assetId, providerId: result.id });
      toast({ title: 'Provider created and linked' });
      setShowNewDialog(false);
      setNewForm({ name: '', category_id: '', phone: '', email: '', notes: '' });
    } catch {
      // errors handled by mutation hooks
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Providers</h2>
          {linkedProviders.length > 0 && (
            <Badge variant="secondary">{linkedProviders.length}</Badge>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={() => setIsAdding(!isAdding)}>
          <Plus className="h-4 w-4" />
          Link Provider
        </Button>
      </div>

      {isAdding && (
        <Select onValueChange={handleLink}>
          <SelectTrigger>
            <SelectValue placeholder="Select a provider…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__new__" className="font-medium">
              <span className="flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5" /> New Provider
              </span>
            </SelectItem>
            {available.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {linkedProviders.length === 0 && !isAdding ? (
        <p className="text-sm text-muted-foreground">No providers linked</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {linkedProviders.map((p) => (
            <Badge
              key={p.id}
              variant="secondary"
              className="cursor-pointer gap-1 pr-1"
            >
              <span onClick={() => onNavigateToProvider?.(p.id)}>{p.name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); handleUnlink(p.id); }}
                className="ml-1 rounded-full p-0.5 hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Provider</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={newForm.name}
                onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                placeholder="Provider name"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={newForm.category_id}
                onValueChange={(v) => setNewForm({ ...newForm, category_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={newForm.phone}
                  onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newForm.email}
                  onChange={(e) => setNewForm({ ...newForm, email: e.target.value })}
                  placeholder="Email address"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={newForm.notes}
                onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })}
                placeholder="Optional notes"
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowNewDialog(false)}>Cancel</Button>
              <Button onClick={handleCreateAndLink} disabled={!newForm.name.trim() || createProvider.isPending}>
                {createProvider.isPending ? 'Saving…' : 'Save & Link'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
