import { useState } from 'react';
import { Link, X, Plus } from 'lucide-react';
import { useProviderAssets, useLinkAssetProvider, useUnlinkAssetProvider } from '@/hooks/useAssetProviders';
import { useAssets } from '@/hooks/useAssets';
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
  providerId: string;
  onNavigateToAsset?: (assetId: string) => void;
}

export function LinkedAssetsSection({ providerId, onNavigateToAsset }: Props) {
  const { data: linkedAssets = [] } = useProviderAssets(providerId);
  const { data: allAssets = [] } = useAssets();
  const linkMutation = useLinkAssetProvider();
  const unlinkMutation = useUnlinkAssetProvider();
  const [isAdding, setIsAdding] = useState(false);

  const linkedIds = new Set(linkedAssets.map((a) => a.id));
  const available = allAssets.filter((a) => !linkedIds.has(a.id));

  const handleLink = (assetId: string) => {
    linkMutation.mutate({ assetId, providerId });
    setIsAdding(false);
  };

  const handleUnlink = (assetId: string) => {
    unlinkMutation.mutate({ assetId, providerId });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Assets</h2>
          {linkedAssets.length > 0 && (
            <Badge variant="secondary">{linkedAssets.length}</Badge>
          )}
        </div>
        {available.length > 0 && (
          <Button size="sm" variant="outline" onClick={() => setIsAdding(!isAdding)}>
            <Plus className="h-4 w-4" />
            Link Asset
          </Button>
        )}
      </div>

      {isAdding && (
        <Select onValueChange={handleLink}>
          <SelectTrigger>
            <SelectValue placeholder="Select an asset…" />
          </SelectTrigger>
          <SelectContent>
            {available.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {linkedAssets.length === 0 && !isAdding ? (
        <p className="text-sm text-muted-foreground">No assets linked</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {linkedAssets.map((a) => (
            <Badge
              key={a.id}
              variant="secondary"
              className="cursor-pointer gap-1 pr-1"
            >
              <span onClick={() => onNavigateToAsset?.(a.id)}>{a.name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); handleUnlink(a.id); }}
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
