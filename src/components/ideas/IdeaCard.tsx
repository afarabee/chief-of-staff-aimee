import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Idea } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { useCategories } from '@/hooks/useCategories';
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

const statusBorderColors: Record<string, string> = {
  new: 'border-l-pink-500',
  'in-progress': 'border-l-violet-500',
  parked: 'border-l-slate-400',
  done: 'border-l-emerald-500',
};

export function IdeaCard({ idea, onClick }: IdeaCardProps) {
  const { deleteIdea } = useApp();
  const { data: categories = [] } = useCategories();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const category = idea.categoryId ? categories.find(c => c.id === idea.categoryId) : null;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    deleteIdea(idea.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div
        className={cn(
          'group rounded-lg border border-l-4 bg-card p-4 shadow-sm hover:shadow-md transition-all hover:bg-accent/50',
          statusBorderColors[idea.status],
          onClick && 'cursor-pointer'
        )}
        onClick={onClick}
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-foreground">{idea.title}</h3>
          <div className="flex items-center gap-1 shrink-0">
            <Badge variant="outline" className={cn('text-xs', statusColors[idea.status])}>
              {statusLabels[idea.status]}
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
        
        {idea.description && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
            {idea.description}
          </p>
        )}

        {category && (
          <div className="mt-2">
            <Badge variant="secondary" className="text-xs">
              {category.icon && <span className="mr-1">{category.icon}</span>}
              {category.name}
            </Badge>
          </div>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Idea</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{idea.title}"? This action cannot be undone.
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
