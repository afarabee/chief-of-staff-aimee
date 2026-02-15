import { useState } from 'react';
import { Link, X, Plus } from 'lucide-react';
import { useAssetProviders, useLinkAssetProvider, useUnlinkAssetProvider } from '@/hooks/useAssetProviders';
import { useProviders } from '@/hooks/useProviders';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Props {
  assetId: string;
  onNavigateToProvider?: (providerId: string) => void;
}

export function LinkedProvidersSection({ assetId, onNavigateToProvider }: Props) {
  const { data: linkedProviders = [] } = useAssetProviders(assetId);
  const { data: allProviders = [] } = useProviders();
  const linkMutation = useLinkAssetProvider();
  const unlinkMutation = useUnlinkAssetProvider();
  const [isAdding, setIsAdding] = useState(false);

  const linkedIds = new Set(linkedProviders.map((p) => p.id));
  const available = allProviders.filter((p) => !linkedIds.has(p.id));

  const handleLink = (providerId: string) => {
    linkMutation.mutate({ assetId, providerId });
    setIsAdding(false);
  };

  const handleUnlink = (providerId: string) => {
    unlinkMutation.mutate({ assetId, providerId });
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
        {available.length > 0 && (
          <Button size="sm" variant="outline" onClick={() => setIsAdding(!isAdding)}>
            <Plus className="h-4 w-4" />
            Link Provider
          </Button>
        )}
      </div>

      {isAdding && (
        <Select onValueChange={handleLink}>
          <SelectTrigger>
            <SelectValue placeholder="Select a provider…" />
          </SelectTrigger>
          <SelectContent>
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
    </div>
  );
}
