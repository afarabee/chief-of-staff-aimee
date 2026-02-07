import { ChevronRight, Mail, Phone } from 'lucide-react';
import type { Provider } from '@/types/providers';

interface ProviderCardProps {
  provider: Provider;
  onClick: () => void;
}

export function ProviderCard({ provider, onClick }: ProviderCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-accent/50"
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium text-card-foreground">{provider.name}</p>
        <div className="flex flex-col gap-0.5 mt-0.5">
          {provider.phone && (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Phone className="h-3 w-3 shrink-0" />
              <span className="truncate">{provider.phone}</span>
            </p>
          )}
          {provider.email && (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{provider.email}</span>
            </p>
          )}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  );
}
