import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Plus, Filter, Trash2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useApp } from '@/contexts/AppContext';
import { Task, TaskStatus, TaskPriority } from '@/types';
import { KanbanColumn } from '@/components/tasks/KanbanColumn';
import { TaskForm } from '@/components/tasks/TaskForm';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
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
import { sortTasksByDateAndPriority } from '@/utils/taskSort';

const statusOrder: TaskStatus[] = ['backlog', 'to-do', 'in-progress', 'blocked', 'done'];

export default function Tasks() {
  usePageTitle('Tasks');
  const { tasks, updateTask, deleteTask, isLoading } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [showPurgeDialog, setShowPurgeDialog] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword), 300);
    return () => clearTimeout(t);
  }, [keyword]);

  // Auto-open edit dialog from search param
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && !isLoading && tasks.length > 0) {
      const task = tasks.find((t) => t.id === editId);
      if (task) {
        setEditingTask(task);
        setIsFormOpen(true);
      }
      searchParams.delete('edit');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, tasks, isLoading]);

  const idsFilter = searchParams.get('ids');
  const idsSet = useMemo(() => idsFilter ? new Set(idsFilter.split(',')) : null, [idsFilter]);

  const clearIdsFilter = () => {
    searchParams.delete('ids');
    setSearchParams(searchParams, { replace: true });
  };

  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (idsSet) {
      return result.filter((task) => idsSet.has(task.id));
    }
    if (priorityFilter !== 'all') {
      result = result.filter((task) => task.priority === priorityFilter);
    }
    if (debouncedKeyword) {
      const kw = debouncedKeyword.toLowerCase();
      result = result.filter((task) =>
        task.title.toLowerCase().includes(kw) ||
        (task.description && task.description.toLowerCase().includes(kw))
      );
    }
    return result;
  }, [tasks, priorityFilter, debouncedKeyword, idsSet]);

  const handleOpenForm = (task?: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setEditingTask(undefined);
    setIsFormOpen(false);
  };

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      backlog: [],
      'to-do': [],
      'in-progress': [],
      blocked: [],
      done: [],
    };

    filteredTasks.forEach((task) => {
      grouped[task.status].push(task);
    });

    Object.keys(grouped).forEach((status) => {
      grouped[status as TaskStatus] = sortTasksByDateAndPriority(grouped[status as TaskStatus]);
    });

    return grouped;
  }, [filteredTasks]);

  const handleDragEnd = (result: DropResult) => {
    const { destination, draggableId } = result;

    if (!destination) return;

    const newStatus = destination.droppableId as TaskStatus;
    const task = tasks.find((t) => t.id === draggableId);

    if (task && task.status !== newStatus) {
      updateTask(task.id, {
        status: newStatus,
        completedAt: newStatus === 'done' ? new Date() : null
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tasks</h1>
            <Skeleton className="h-5 w-48 mt-1" />
          </div>
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="flex gap-4">
          {statusOrder.map((status) => (
            <div key={status} className="flex-shrink-0 w-72">
              <Skeleton className="h-8 w-24 mb-3" />
              <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 mb-6">
        <Button onClick={() => handleOpenForm()} className="gap-2">
          <Plus className="h-4 w-4" />
          New Task
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tasks</h1>
          <p className="text-muted-foreground">
            Manage and track all your tasks
          </p>
        </div>
      </div>

      {idsSet && (
        <div className="flex items-center gap-2 mb-4 p-2 rounded-md bg-muted">
          <span className="text-sm text-muted-foreground">Showing {idsSet.size} filtered result{idsSet.size !== 1 ? 's' : ''} from chat</span>
          <Button variant="outline" size="sm" onClick={clearIdsFilter}>Clear filter</Button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filter:</span>
        </div>

        <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as TaskPriority | 'all')}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="pl-9 w-full sm:w-[200px]"
          />
        </div>

        {tasksByStatus.done.length > 0 && (
          <Button variant="destructive" size="sm" className="gap-2 ml-auto" onClick={() => setShowPurgeDialog(true)}>
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Purge Done</span>
            <span className="sm:hidden">Purge</span>
            ({tasksByStatus.done.length})
          </Button>
        )}
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-4 min-h-[calc(100vh-280px)]">
            {statusOrder.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={tasksByStatus[status]}
                onTaskClick={handleOpenForm}
              />
            ))}
          </div>
        </div>
      </DragDropContext>

      <ResponsiveFormDialog
        open={isFormOpen}
        onOpenChange={(open) => !open && handleCloseForm()}
        title={editingTask ? 'Edit Task' : 'New Task'}
      >
        <TaskForm
          task={editingTask}
          onClose={handleCloseForm}
        />
      </ResponsiveFormDialog>

      <AlertDialog open={showPurgeDialog} onOpenChange={setShowPurgeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Purge completed tasks?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{tasksByStatus.done.length}</strong> completed task{tasksByStatus.done.length !== 1 ? 's' : ''}. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                const count = tasksByStatus.done.length;
                tasksByStatus.done.forEach((t) => deleteTask(t.id));
                toast({ title: `${count} completed task${count !== 1 ? 's' : ''} deleted` });
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
