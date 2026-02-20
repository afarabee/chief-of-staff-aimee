import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { isToday, isPast, startOfDay, isFuture, compareAsc } from 'date-fns';
import { AlertTriangle, Calendar, Lightbulb, ArrowRight, Clock } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Task, Idea } from '@/types';
import { TaskCard } from '@/components/tasks/TaskCard';
import { IdeaCard } from '@/components/ideas/IdeaCard';
import { TaskForm } from '@/components/tasks/TaskForm';
import { IdeaForm } from '@/components/ideas/IdeaForm';
import { QuickAdd } from '@/components/dashboard/QuickAdd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveFormDialog } from '@/components/ui/responsive-dialog';

const Index = () => {
  usePageTitle('Dashboard');
  const { tasks, ideas, isLoading, addIdea } = useApp();
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [editingIdea, setEditingIdea] = useState<Idea | undefined>();
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isIdeaFormOpen, setIsIdeaFormOpen] = useState(false);
  const [captureText, setCaptureText] = useState('');

  const handleQuickCapture = () => {
    if (!captureText.trim()) return;
    
    addIdea({
      title: captureText.trim(),
      description: '',
      status: 'new',
      categoryId: null,
      imageUrl: null,
    });
    
    setCaptureText('');
  };

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

  const todayTasks = useMemo(() => {
    return tasks.filter(
      (task) =>
        task.dueDate &&
        isToday(task.dueDate) &&
        task.status !== 'done'
    );
  }, [tasks]);

  const overdueTasks = useMemo(() => {
    return tasks.filter(
      (task) =>
        task.dueDate &&
        isPast(task.dueDate) &&
        !isToday(task.dueDate) &&
        task.status !== 'done'
    );
  }, [tasks]);

  const inProgressIdeas = useMemo(() => {
    return ideas.filter((idea) => idea.status === 'in-progress');
  }, [ideas]);

  const comingUpTasks = useMemo(() => {
    const statusPriority: Record<string, number> = {
      'blocked': 0,
      'in-progress': 1,
      'to-do': 2,
      'backlog': 3,
    };

    const eligibleTasks = tasks.filter(
      (task) =>
        task.status !== 'done' &&
        !(task.dueDate && isToday(task.dueDate)) &&
        !(task.dueDate && isPast(task.dueDate) && !isToday(task.dueDate))
    );

    const futureDatedTasks = eligibleTasks
      .filter((task) => task.dueDate && isFuture(task.dueDate))
      .sort((a, b) => compareAsc(a.dueDate!, b.dueDate!));

    const undatedTasks = eligibleTasks
      .filter((task) => !task.dueDate)
      .sort((a, b) => (statusPriority[a.status] ?? 99) - (statusPriority[b.status] ?? 99));

    return [...futureDatedTasks, ...undatedTasks].slice(0, 3);
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Today</h1>
            <Skeleton className="h-5 w-48 mt-1" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:gap-8 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-x-hidden">
      <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Today</h1>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <QuickAdd />
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Capture a thought..."
          value={captureText}
          onChange={(e) => setCaptureText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleQuickCapture()}
          className="flex-1"
        />
        <Button onClick={handleQuickCapture} disabled={!captureText.trim()} className="min-h-[44px]">
          Save
        </Button>
      </div>

      <div className="grid gap-4 md:gap-8 md:grid-cols-2 min-w-0">
        {/* Overdue Tasks */}
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/30 shadow-md min-w-0 overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <CardTitle className="text-lg">Overdue</CardTitle>
                {overdueTasks.length > 0 && (
                  <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-medium text-destructive-foreground">
                    {overdueTasks.length}
                  </span>
                )}
              </div>
              <Button variant="ghost" size="sm" className="min-h-[44px]" asChild>
                <Link to="/tasks" className="gap-1">
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {overdueTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No overdue tasks. You're all caught up! 🎉
              </p>
            ) : (
              <div className="space-y-3 min-w-0">
                {overdueTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onClick={() => handleOpenTaskForm(task)} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks Due Today */}
        <Card className="border-sky-200 bg-sky-50 dark:bg-sky-950/30 shadow-md min-w-0 overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Due Today</CardTitle>
                {todayTasks.length > 0 && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                    {todayTasks.length}
                  </span>
                )}
              </div>
              <Button variant="ghost" size="sm" className="min-h-[44px]" asChild>
                <Link to="/tasks" className="gap-1">
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {todayTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No tasks due today. Plan ahead!
              </p>
            ) : (
              <div className="space-y-3 min-w-0">
                {todayTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onClick={() => handleOpenTaskForm(task)} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Coming Up */}
      <Card className="border-muted bg-muted/30 shadow-md min-w-0 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Coming Up</CardTitle>
              {comingUpTasks.length > 0 && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {comingUpTasks.length}
                </span>
              )}
            </div>
              <Button variant="ghost" size="sm" className="min-h-[44px]" asChild>
                <Link to="/tasks" className="gap-1">
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {comingUpTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No upcoming tasks. Add some tasks to get started!
            </p>
          ) : (
            <div className="space-y-3 min-w-0">
              {comingUpTasks.map((task) => (
                <TaskCard key={task.id} task={task} onClick={() => handleOpenTaskForm(task)} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* In-Progress Ideas */}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/30 shadow-md min-w-0 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-warning" />
              <CardTitle className="text-lg">Ideas in Progress</CardTitle>
              {inProgressIdeas.length > 0 && (
                <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                  {inProgressIdeas.length}
                </span>
              )}
            </div>
              <Button variant="ghost" size="sm" className="min-h-[44px]" asChild>
                <Link to="/ideas" className="gap-1">
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
          </div>
        </CardHeader>
        <CardContent>
          {inProgressIdeas.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No ideas in progress. Time to start something new!
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 min-w-0">
              {inProgressIdeas.map((idea) => (
                <IdeaCard key={idea.id} idea={idea} onClick={() => handleOpenIdeaForm(idea)} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Edit Dialog */}
      <ResponsiveFormDialog
        open={isTaskFormOpen}
        onOpenChange={(open) => !open && handleCloseTaskForm()}
        title="Edit Task"
      >
        <TaskForm task={editingTask} onClose={handleCloseTaskForm} />
      </ResponsiveFormDialog>

      {/* Idea Edit Dialog */}
      <ResponsiveFormDialog
        open={isIdeaFormOpen}
        onOpenChange={(open) => !open && handleCloseIdeaForm()}
        title="Edit Idea"
      >
        <IdeaForm idea={editingIdea} onClose={handleCloseIdeaForm} />
      </ResponsiveFormDialog>
    </div>
  );
};

export default Index;
