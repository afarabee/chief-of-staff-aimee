import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAssetCategories } from '@/hooks/useAssets';
import { useCreateProvider, useUpdateProvider } from '@/hooks/useProviders';
import type { Provider } from '@/types/providers';

interface ProviderFormProps {
  provider?: Provider;
  onClose: () => void;
}

export function ProviderForm({ provider, onClose }: ProviderFormProps) {
  const isEdit = !!provider;
  const [name, setName] = useState(provider?.name ?? '');
  const [categoryId, setCategoryId] = useState<string>(provider?.categoryId ?? '');
  const [phone, setPhone] = useState(provider?.phone ?? '');
  const [email, setEmail] = useState(provider?.email ?? '');
  const [address, setAddress] = useState(provider?.address ?? '');
  const [website, setWebsite] = useState(provider?.website ?? '');
  const [notes, setNotes] = useState(provider?.notes ?? '');

  const { data: categories = [] } = useAssetCategories();
  const createProvider = useCreateProvider();
  const updateProvider = useUpdateProvider();
  const isPending = createProvider.isPending || updateProvider.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      name: name.trim(),
      category_id: categoryId || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      address: address.trim() || null,
      website: website.trim() || null,
      notes: notes.trim() || null,
    };

    if (isEdit) {
      updateProvider.mutate({ id: provider.id, ...payload }, { onSuccess: onClose });
    } else {
      createProvider.mutate(payload, { onSuccess: onClose });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="provider-name">Name *</Label>
        <Input id="provider-name" value={name} onChange={(e) => setName(e.target.value)} required />
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
        <Label htmlFor="provider-phone">Phone</Label>
        <Input id="provider-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="provider-email">Email</Label>
        <Input id="provider-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="provider-address">Address</Label>
        <Textarea id="provider-address" value={address} onChange={(e) => setAddress(e.target.value)} rows={2} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="provider-website">Website</Label>
        <Input id="provider-website" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="provider-notes">Notes</Label>
        <Textarea id="provider-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
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
