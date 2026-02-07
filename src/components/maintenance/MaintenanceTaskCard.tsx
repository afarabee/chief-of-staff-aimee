import { format, parseISO, isPast, isToday, isTomorrow, formatDistanceToNow } from 'date-fns';
import { CheckCircle2, Circle, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { MaintenanceTask } from '@/types/maintenance';
import { recurrenceLabel } from '@/types/maintenance';

interface MaintenanceTaskCardProps {
  task: MaintenanceTask;
  variant: 'overdue' | 'attention' | 'upcoming' | 'completed';
  onComplete?: () => void;
  onClick?: () => void;
}

function friendlyDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = parseISO(dateStr);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  return format(d, 'EEE, MMM d');
}

export function MaintenanceTaskCard({ task, variant, onComplete, onClick }: MaintenanceTaskCardProps) {
  const isCompleted = variant === 'completed';
  const isOverdue = variant === 'overdue';

  const dateDisplay = (() => {
    if (isCompleted && task.dateCompleted) {
      return format(parseISO(task.dateCompleted), 'MMM d, yyyy');
    }
    if (isOverdue && task.nextDueDate) {
      return formatDistanceToNow(parseISO(task.nextDueDate), { addSuffix: false }) + ' overdue';
    }
    return friendlyDate(task.nextDueDate);
  })();

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border p-3 transition-colors cursor-pointer hover:bg-accent/50',
        isCompleted && 'opacity-70'
      )}
      onClick={onClick}
    >
      {!isCompleted && onComplete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onComplete();
          }}
        >
          <Circle className="h-5 w-5 text-muted-foreground" />
        </Button>
      )}
      {isCompleted && (
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
      )}

      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium truncate', isCompleted && 'line-through text-muted-foreground')}>
          {task.name}
        </p>
        {task.assetName && (
          <p className="text-xs text-muted-foreground truncate">{task.assetName}</p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {task.recurrenceRule && !isCompleted && (
          <Badge variant="outline" className="text-xs gap-1 px-1.5">
            <Repeat className="h-3 w-3" />
            {recurrenceLabel(task.recurrenceRule)}
          </Badge>
        )}
        <span
          className={cn(
            'text-xs whitespace-nowrap',
            isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'
          )}
        >
          {dateDisplay}
        </span>
      </div>
    </div>
  );
}
