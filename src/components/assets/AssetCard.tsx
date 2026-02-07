import { ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { Asset } from '@/types/assets';

interface AssetCardProps {
  asset: Asset;
  onClick: () => void;
}

export function AssetCard({ asset, onClick }: AssetCardProps) {
  const formattedDate = asset.purchaseDate
    ? format(parseISO(asset.purchaseDate), 'MMM yyyy')
    : null;

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-accent/50"
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium text-card-foreground">{asset.name}</p>
        {asset.description && (
          <p className="truncate text-sm text-muted-foreground">{asset.description}</p>
        )}
      </div>
      {formattedDate && (
        <span className="shrink-0 text-xs text-muted-foreground">{formattedDate}</span>
      )}
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  );
}
