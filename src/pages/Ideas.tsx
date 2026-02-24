import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Filter, Trash2 } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useApp } from '@/contexts/AppContext';
import { Idea, IdeaStatus } from '@/types';
import { IdeaCard } from '@/components/ideas/IdeaCard';
import { IdeaForm } from '@/components/ideas/IdeaForm';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveFormDialog } from '@/components/ui/responsive-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { toast } from '@/hooks/use-toast';

export default function Ideas() {
  usePageTitle('Ideas');
  const { ideas, isLoading, deleteIdea } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | undefined>();
  const [statusFilter, setStatusFilter] = useState<IdeaStatus | 'all'>('all');
  const [showPurgeDialog, setShowPurgeDialog] = useState(false);

  // Auto-open edit dialog from search param
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && !isLoading && ideas.length > 0) {
      const idea = ideas.find((i) => i.id === editId);
      if (idea) {
        setEditingIdea(idea);
        setIsFormOpen(true);
      }
      searchParams.delete('edit');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, ideas, isLoading]);

  const filteredIdeas = useMemo(() => {
    if (statusFilter === 'all') return ideas;
    return ideas.filter((idea) => idea.status === statusFilter);
  }, [ideas, statusFilter]);

  const handleOpenForm = (idea?: Idea) => {
    setEditingIdea(idea);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setEditingIdea(undefined);
    setIsFormOpen(false);
  };

  const ideasByStatus = useMemo(() => {
    const grouped: Record<IdeaStatus, Idea[]> = {
      new: [],
      'in-progress': [],
      parked: [],
      done: [],
    };
    
    filteredIdeas.forEach((idea) => {
      grouped[idea.status].push(idea);
    });
    
    return grouped;
  }, [filteredIdeas]);

  const statusLabels: Record<IdeaStatus, string> = {
    new: 'New',
    'in-progress': 'In Progress',
    parked: 'Parked',
    done: 'Done',
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Ideas</h1>
            <Skeleton className="h-5 w-40 mt-1" />
          </div>
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button onClick={() => handleOpenForm()} className="gap-2">
          <Plus className="h-4 w-4" />
          New Idea
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Ideas</h1>
          <p className="text-muted-foreground">
            Capture and develop your ideas
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filter:</span>
        </div>
        
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as IdeaStatus | 'all')}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="parked">Parked</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>

        {ideasByStatus.done.length > 0 && (
          <Button variant="destructive" size="sm" className="gap-2 ml-auto" onClick={() => setShowPurgeDialog(true)}>
            <Trash2 className="h-4 w-4" />
            Purge Done ({ideasByStatus.done.length})
          </Button>
        )}
      </div>

      {filteredIdeas.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <p className="text-muted-foreground">No ideas found</p>
          <Button variant="link" onClick={() => handleOpenForm()}>
            Capture your first idea
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {(Object.entries(ideasByStatus) as [IdeaStatus, Idea[]][]).map(
            ([status, statusIdeas]) =>
              statusIdeas.length > 0 && (
                <div key={status}>
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {statusLabels[status]} ({statusIdeas.length})
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {statusIdeas.map((idea) => (
                      <IdeaCard
                        key={idea.id}
                        idea={idea}
                        onClick={() => handleOpenForm(idea)}
                      />
                    ))}
                  </div>
                </div>
              )
          )}
        </div>
      )}

      <ResponsiveFormDialog
        open={isFormOpen}
        onOpenChange={(open) => !open && handleCloseForm()}
        title={editingIdea ? 'Edit Idea' : 'New Idea'}
      >
        <IdeaForm idea={editingIdea} onClose={handleCloseForm} />
      </ResponsiveFormDialog>

      <AlertDialog open={showPurgeDialog} onOpenChange={setShowPurgeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Purge completed ideas?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{ideasByStatus.done.length}</strong> completed idea{ideasByStatus.done.length !== 1 ? 's' : ''}. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                const count = ideasByStatus.done.length;
                ideasByStatus.done.forEach((i) => deleteIdea(i.id));
                toast({ title: `${count} completed idea${count !== 1 ? 's' : ''} deleted` });
              }}
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
