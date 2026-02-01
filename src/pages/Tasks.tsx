import { useState, useMemo } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Plus, Filter } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Task, TaskStatus, TaskPriority } from '@/types';
import { KanbanColumn } from '@/components/tasks/KanbanColumn';
import { TaskForm } from '@/components/tasks/TaskForm';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const statusOrder: TaskStatus[] = ['backlog', 'to-do', 'in-progress', 'blocked', 'done'];

export default function Tasks() {
  const { tasks, updateTask, isLoading } = useApp();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');

  const filteredTasks = useMemo(() => {
    if (priorityFilter === 'all') return tasks;
    return tasks.filter((task) => task.priority === priorityFilter);
  }, [tasks, priorityFilter]);

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

      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filter:</span>
        </div>

        <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as TaskPriority | 'all')}>
          <SelectTrigger className="w-[140px]">
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

      <Dialog open={isFormOpen} onOpenChange={(open) => !open && handleCloseForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'New Task'}</DialogTitle>
          </DialogHeader>
          <TaskForm task={editingTask} onClose={handleCloseForm} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
