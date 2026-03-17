import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { TaskCard } from '@/components/tasks/TaskCard';
import { IdeaCard } from '@/components/ideas/IdeaCard';
import { TaskForm } from '@/components/tasks/TaskForm';
import { IdeaForm } from '@/components/ideas/IdeaForm';
import { ResponsiveFormDialog } from '@/components/ui/responsive-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { usePageTitle } from '@/hooks/usePageTitle';
import type { Task, Idea } from '@/types';

export default function BriefingItems() {
  usePageTitle('Briefing Items');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { tasks, ideas, isLoading } = useApp();

  const ids = useMemo(() => {
    const raw = searchParams.get('ids') || '';
    return raw.split(',').filter(Boolean);
  }, [searchParams]);

  const matchedTasks = useMemo(() => tasks.filter(t => ids.includes(t.id)), [tasks, ids]);
  const matchedIdeas = useMemo(() => ideas.filter(i => ids.includes(i.id)), [ideas, ids]);

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [ideaDialogOpen, setIdeaDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/command-center')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Briefing Items</h1>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : matchedTasks.length === 0 && matchedIdeas.length === 0 ? (
        <p className="text-muted-foreground">No matching items found.</p>
      ) : (
        <div className="space-y-6">
          {matchedTasks.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Tasks ({matchedTasks.length})</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {matchedTasks.map(task => (
                  <TaskCard key={task.id} task={task} onClick={() => { setEditingTask(task); setTaskDialogOpen(true); }} />
                ))}
              </div>
            </div>
          )}
          {matchedIdeas.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Ideas ({matchedIdeas.length})</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {matchedIdeas.map(idea => (
                  <IdeaCard key={idea.id} idea={idea} onClick={() => { setEditingIdea(idea); setIdeaDialogOpen(true); }} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <ResponsiveFormDialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen} title="Edit Task">
        <TaskForm task={editingTask ?? undefined} onClose={() => { setTaskDialogOpen(false); setEditingTask(null); }} />
      </ResponsiveFormDialog>

      <ResponsiveFormDialog open={ideaDialogOpen} onOpenChange={setIdeaDialogOpen} title="Edit Idea">
        <IdeaForm idea={editingIdea ?? undefined} onClose={() => { setIdeaDialogOpen(false); setEditingIdea(null); }} />
      </ResponsiveFormDialog>
    </div>
  );
}
