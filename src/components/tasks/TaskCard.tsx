import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, isToday, isPast } from 'date-fns';
import { Calendar, AlertCircle, Trash2, ImageIcon } from 'lucide-react';
import { Task } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { useCategories } from '@/hooks/useCategories';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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

const statusBorderColors: Record<string, string> = {
  backlog: 'border-l-slate-400',
  'to-do': 'border-l-sky-500',
  'in-progress': 'border-l-violet-500',
  blocked: 'border-l-orange-500',
  done: 'border-l-emerald-500',
};

const priorityBackgrounds: Record<string, string> = {
  urgent: 'bg-red-50 dark:bg-red-950/30',
  high: 'bg-pink-50 dark:bg-pink-950/30',
  medium: '',
  low: '',
};

export function TaskCard({ task, onClick, showCheckbox = true }: TaskCardProps) {
  const navigate = useNavigate();
  const { toggleTaskComplete, deleteTask } = useApp();
  const { data: categories = [] } = useCategories();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const isComplete = task.status === 'done';
  const isOverdue = task.dueDate && isPast(task.dueDate) && !isToday(task.dueDate) && !isComplete;

  const category = task.categoryId ? categories.find(c => c.id === task.categoryId) : null;

  const handleCategoryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (category) {
      navigate(`/category/${category.id}`);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    deleteTask(task.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div
        className={cn(
          'group flex items-start gap-3 rounded-lg border border-l-4 p-4 shadow-sm hover:shadow-md transition-all overflow-hidden',
          priorityBackgrounds[task.priority] || 'bg-card',
          !priorityBackgrounds[task.priority] && 'hover:bg-accent/50',
          priorityBackgrounds[task.priority] && 'hover:brightness-95',
          statusBorderColors[task.status],
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
          <div className="flex items-start justify-between gap-2 min-w-0">
            <h3 className={cn(
              'font-medium text-foreground truncate',
              isComplete && 'line-through text-muted-foreground'
            )}>
              {task.title}
            </h3>
            <div className="flex items-center gap-1 shrink-0">
              <Badge variant="outline" className={cn('text-xs', priorityColors[task.priority])}>
                {task.priority}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          
          {task.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}

          {task.imageUrl && (
            <div className="mt-2 relative rounded overflow-hidden w-16 h-16 border border-border">
              <img
                src={task.imageUrl}
                alt="Task attachment"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={cn('text-xs', statusColors[task.status])}>
              {task.status}
            </Badge>
            
            {category && (
              <Badge 
                variant="secondary" 
                className="text-xs cursor-pointer hover:bg-secondary/80"
                onClick={handleCategoryClick}
              >
                {category.icon && <span className="mr-1">{category.icon}</span>}
                {category.name}
              </Badge>
            )}
            
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

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{task.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
