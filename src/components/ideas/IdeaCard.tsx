import { Idea } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface IdeaCardProps {
  idea: Idea;
  onClick?: () => void;
}

const statusColors: Record<string, string> = {
  new: 'bg-primary/10 text-primary border-primary/20',
  'in-progress': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  parked: 'bg-muted text-muted-foreground',
  done: 'bg-green-500/10 text-green-600 border-green-500/20',
};

const statusLabels: Record<string, string> = {
  new: 'New',
  'in-progress': 'In Progress',
  parked: 'Parked',
  done: 'Done',
};

export function IdeaCard({ idea, onClick }: IdeaCardProps) {
  return (
    <div
      className={cn(
        'group rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-foreground">{idea.title}</h3>
        <Badge variant="outline" className={cn('shrink-0 text-xs', statusColors[idea.status])}>
          {statusLabels[idea.status]}
        </Badge>
      </div>
      
      {idea.description && (
        <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
          {idea.description}
        </p>
      )}
    </div>
  );
}
