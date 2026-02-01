import { format, isToday, isPast } from 'date-fns';
import { Calendar, AlertCircle } from 'lucide-react';
import { Task } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  showCheckbox?: boolean;
}

const priorityColors: Record<string, string> = {
  urgent: 'bg-destructive text-destructive-foreground',
  high: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  medium: 'bg-primary/10 text-primary border-primary/20',
  low: 'bg-muted text-muted-foreground',
};

const statusColors: Record<string, string> = {
  backlog: 'bg-muted text-muted-foreground',
  'to-do': 'bg-primary/10 text-primary border-primary/20',
  'in-progress': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  blocked: 'bg-destructive/10 text-destructive border-destructive/20',
  done: 'bg-green-500/10 text-green-600 border-green-500/20',
};

export function TaskCard({ task, onClick, showCheckbox = true }: TaskCardProps) {
  const { toggleTaskComplete } = useApp();
  const isComplete = task.status === 'done';
  const isOverdue = task.dueDate && isPast(task.dueDate) && !isToday(task.dueDate) && !isComplete;

  return (
    <div
      className={cn(
        'group flex items-start gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50',
        isComplete && 'opacity-60',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      {showCheckbox && (
        <Checkbox
          checked={isComplete}
          onCheckedChange={(e) => {
            e && toggleTaskComplete(task.id);
          }}
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5"
        />
      )}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className={cn(
            'font-medium text-foreground',
            isComplete && 'line-through text-muted-foreground'
          )}>
            {task.title}
          </h3>
          <Badge variant="outline" className={cn('shrink-0 text-xs', priorityColors[task.priority])}>
            {task.priority}
          </Badge>
        </div>
        
        {task.description && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}
        
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={cn('text-xs', statusColors[task.status])}>
            {task.status}
          </Badge>
          
          {task.dueDate && (
            <div className={cn(
              'flex items-center gap-1 text-xs',
              isOverdue ? 'text-destructive' : 'text-muted-foreground'
            )}>
              {isOverdue ? <AlertCircle className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
              <span>{format(task.dueDate, 'MMM d')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
