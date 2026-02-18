import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { ArrowLeft, CheckSquare, Lightbulb } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useCategories } from '@/hooks/useCategories';
import { Task, Idea } from '@/types';
import { TaskCard } from '@/components/tasks/TaskCard';
import { IdeaCard } from '@/components/ideas/IdeaCard';
import { TaskForm } from '@/components/tasks/TaskForm';
import { IdeaForm } from '@/components/ideas/IdeaForm';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveFormDialog } from '@/components/ui/responsive-dialog';

export default function CategoryDetail() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { tasks, ideas, isLoading } = useApp();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();

  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [editingIdea, setEditingIdea] = useState<Idea | undefined>();
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isIdeaFormOpen, setIsIdeaFormOpen] = useState(false);

  const category = categories.find((c) => c.id === categoryId);
  usePageTitle(category?.name);

  const categoryTasks = useMemo(
    () => tasks.filter((t) => t.categoryId === categoryId),
    [tasks, categoryId]
  );

  const categoryIdeas = useMemo(
    () => ideas.filter((i) => i.categoryId === categoryId),
    [ideas, categoryId]
  );

  const handleOpenTaskForm = (task: Task) => {
    setEditingTask(task);
    setIsTaskFormOpen(true);
  };

  const handleCloseTaskForm = () => {
    setEditingTask(undefined);
    setIsTaskFormOpen(false);
  };

  const handleOpenIdeaForm = (idea: Idea) => {
    setEditingIdea(idea);
    setIsIdeaFormOpen(true);
  };

  const handleCloseIdeaForm = () => {
    setEditingIdea(undefined);
    setIsIdeaFormOpen(false);
  };

  if (isLoading || categoriesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-6 w-24" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <p className="text-muted-foreground">Category not found</p>
        <Button variant="outline" onClick={() => navigate('/categories')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Categories
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          {category.icon && (
            <span className="text-4xl">{category.icon}</span>
          )}
          <h1 className="text-3xl font-bold text-foreground">{category.name}</h1>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Tasks</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {categoryTasks.length}
          </span>
        </div>

        {categoryTasks.length === 0 ? (
          <div className="rounded-lg border border-dashed py-8 text-center">
            <p className="text-sm text-muted-foreground">No active tasks in this category</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categoryTasks.map((task) => (
              <TaskCard key={task.id} task={task} onClick={() => handleOpenTaskForm(task)} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Ideas</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {categoryIdeas.length}
          </span>
        </div>

        {categoryIdeas.length === 0 ? (
          <div className="rounded-lg border border-dashed py-8 text-center">
            <p className="text-sm text-muted-foreground">No active ideas in this category</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categoryIdeas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} onClick={() => handleOpenIdeaForm(idea)} />
            ))}
          </div>
        )}
      </section>

      <ResponsiveFormDialog
        open={isTaskFormOpen}
        onOpenChange={(open) => !open && handleCloseTaskForm()}
        title="Edit Task"
      >
        <TaskForm task={editingTask} onClose={handleCloseTaskForm} />
      </ResponsiveFormDialog>

      <ResponsiveFormDialog
        open={isIdeaFormOpen}
        onOpenChange={(open) => !open && handleCloseIdeaForm()}
        title="Edit Idea"
      >
        <IdeaForm idea={editingIdea} onClose={handleCloseIdeaForm} />
      </ResponsiveFormDialog>
    </div>
  );
}
