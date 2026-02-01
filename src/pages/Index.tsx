import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { isToday, isPast, startOfDay } from 'date-fns';
import { AlertTriangle, Calendar, Lightbulb, ArrowRight } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { TaskCard } from '@/components/tasks/TaskCard';
import { IdeaCard } from '@/components/ideas/IdeaCard';
import { QuickAdd } from '@/components/dashboard/QuickAdd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const Index = () => {
  const { tasks, ideas, isLoading } = useApp();

  const todayTasks = useMemo(() => {
    return tasks.filter(
      (task) =>
        task.dueDate &&
        isToday(task.dueDate) &&
        task.status !== 'done'
    );
  }, [tasks]);

  const overdueTasks = useMemo(() => {
    const today = startOfDay(new Date());
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
        <div className="grid gap-6 lg:grid-cols-2">
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Today</h1>
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Overdue Tasks */}
        <Card className="border-destructive/20">
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
              <Button variant="ghost" size="sm" asChild>
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
              <div className="space-y-3">
                {overdueTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks Due Today */}
        <Card>
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
              <Button variant="ghost" size="sm" asChild>
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
              <div className="space-y-3">
                {todayTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* In-Progress Ideas */}
      <Card>
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
            <Button variant="ghost" size="sm" asChild>
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
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {inProgressIdeas.map((idea) => (
                <IdeaCard key={idea.id} idea={idea} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
