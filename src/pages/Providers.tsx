import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { icons } from 'lucide-react';
import { ArrowLeft, Globe, Mail, MapPin, Pencil, Phone, Plus, Search, Trash2, Wrench } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useProviders, useDeleteProvider } from '@/hooks/useProviders';
import { ProviderCard } from '@/components/providers/ProviderCard';
import { ProviderForm } from '@/components/providers/ProviderForm';
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
import type { Provider } from '@/types/providers';
import { LinkedAssetsSection } from '@/components/links/LinkedAssetsSection';

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const pascalName = name.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('');
  const Icon = (icons as Record<string, any>)[pascalName];
  if (!Icon) return null;
  return <Icon className={className} />;
}

export default function Providers() {
  usePageTitle('Providers');
  const { data: providers = [], isLoading } = useProviders();
  const deleteProvider = useDeleteProvider();
  const navigate = useNavigate();

  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | undefined>(undefined);
  const [searchParams, setSearchParams] = useSearchParams();
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword), 300);
    return () => clearTimeout(t);
  }, [keyword]);
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && !isLoading && providers.length > 0) {
      const found = providers.find((p) => p.id === editId);
      if (found) {
        setEditingProvider(found);
        setIsFormOpen(true);
      }
      searchParams.delete('edit');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, providers, isLoading]);

  const openAdd = () => { setEditingProvider(undefined); setIsFormOpen(true); };
  const openEdit = (provider: Provider) => { setEditingProvider(provider); setIsFormOpen(true); };
  const closeForm = () => setIsFormOpen(false);

  const openDetail = (provider: Provider) => { setSelectedProvider(provider); setView('detail'); };
  const backToList = () => { setView('list'); setSelectedProvider(null); };

  const handleDelete = (id: string) => { deleteProvider.mutate(id, { onSuccess: backToList }); };

  const filteredProviders = useMemo(() => {
    if (!debouncedKeyword) return providers;
    const kw = debouncedKeyword.toLowerCase();
    return providers.filter((p) =>
      p.name.toLowerCase().includes(kw) ||
      (p.notes && p.notes.toLowerCase().includes(kw))
    );
  }, [providers, debouncedKeyword]);

  const grouped = filteredProviders.reduce<Record<string, { name: string; icon: string | null; color: string | null; providers: Provider[] }>>((acc, p) => {
    const key = p.categoryName ?? 'Uncategorized';
    if (!acc[key]) acc[key] = { name: key, icon: p.categoryIcon ?? null, color: p.categoryColor ?? null, providers: [] };
    acc[key].providers.push(p);
    return acc;
  }, {});
  const groups = Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name));

  if (view === 'detail' && selectedProvider) {
    const fresh = providers.find((p) => p.id === selectedProvider.id) ?? selectedProvider;
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
                  <AlertDialogTitle>Delete Provider</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this provider?
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

        <div className="space-y-3">
          {fresh.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a href={`tel:${fresh.phone}`} className="text-foreground underline-offset-4 hover:underline">{fresh.phone}</a>
            </div>
          )}
          {fresh.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href={`mailto:${fresh.email}`} className="text-foreground underline-offset-4 hover:underline">{fresh.email}</a>
            </div>
          )}
          {fresh.address && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{fresh.address}</span>
            </div>
          )}
          {fresh.website && (
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <a href={fresh.website} target="_blank" rel="noopener noreferrer" className="text-foreground underline-offset-4 hover:underline">{fresh.website}</a>
            </div>
          )}
          {fresh.notes && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Notes</p>
              <p className="text-foreground whitespace-pre-wrap">{fresh.notes}</p>
            </div>
          )}
        </div>

        <LinkedAssetsSection providerId={fresh.id} onNavigateToAsset={(assetId) => navigate(`/assets?detail=${assetId}`)} />

        <ResponsiveFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} title={editingProvider ? 'Edit Provider' : 'Add Provider'}>
          <ProviderForm provider={editingProvider} onClose={closeForm} />
        </ResponsiveFormDialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Providers</h1>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add Provider
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : providers.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Wrench className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No service providers yet. Add your first provider to get started.</p>
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add Provider
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
              {group.providers.map((provider) => (
                <ProviderCard key={provider.id} provider={provider} onClick={() => openDetail(provider)} />
              ))}
            </div>
          </div>
        ))
      )}

      <ResponsiveFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} title={editingProvider ? 'Edit Provider' : 'Add Provider'}>
        <ProviderForm provider={editingProvider} onClose={closeForm} />
      </ResponsiveFormDialog>
    </div>
  );
}
