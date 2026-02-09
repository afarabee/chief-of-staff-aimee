import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Plus, Filter } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Task, TaskStatus, TaskPriority } from '@/types';
import { KanbanColumn } from '@/components/tasks/KanbanColumn';
import { TaskForm } from '@/components/tasks/TaskForm';
import { MaintenanceTaskForm } from '@/components/maintenance/MaintenanceTaskForm';
import { useKanbanMaintenanceTasks } from '@/hooks/useMaintenanceTasks';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { MaintenanceTask } from '@/types/maintenance';

const statusOrder: TaskStatus[] = ['backlog', 'to-do', 'in-progress', 'blocked', 'done'];

export default function Tasks() {
  usePageTitle('Tasks');
  const { tasks, updateTask, isLoading } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [showMaintenance, setShowMaintenance] = useState(true);
  const [editingMaintenanceTask, setEditingMaintenanceTask] = useState<MaintenanceTask | undefined>();
  const [isMaintenanceFormOpen, setIsMaintenanceFormOpen] = useState(false);

  const { data: maintenanceTasks = [] } = useKanbanMaintenanceTasks();

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
    
    // Sort each column: tasks with due dates first (ascending), then tasks without due dates
    Object.keys(grouped).forEach((status) => {
      grouped[status as TaskStatus].sort((a, b) => {
        // Tasks with due dates come before tasks without
        if (a.dueDate && !b.dueDate) return -1;
        if (!a.dueDate && b.dueDate) return 1;
        // Both have due dates: sort ascending (earliest/overdue first)
        if (a.dueDate && b.dueDate) {
          return a.dueDate.getTime() - b.dueDate.getTime();
        }
        // Neither has due date: maintain original order
        return 0;
      });
    });
    
    return grouped;
  }, [filteredTasks]);

  // Map maintenance tasks to kanban columns
  const maintenanceByStatus = useMemo(() => {
    if (!showMaintenance) return {} as Record<TaskStatus, MaintenanceTask[]>;
    const mapped: Partial<Record<TaskStatus, MaintenanceTask[]>> = {};
    maintenanceTasks.forEach((t) => {
      let col: TaskStatus;
      if (t.status === 'needs_attention') col = 'blocked';
      else if (t.status === 'in_progress') col = 'in-progress';
      else if (t.status === 'completed') col = 'done';
      else col = 'to-do';
      if (!mapped[col]) mapped[col] = [];
      mapped[col]!.push(t);
    });
    return mapped;
  }, [maintenanceTasks, showMaintenance]);

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

        <div className="flex items-center gap-2 ml-auto">
          <Switch id="show-maintenance" checked={showMaintenance} onCheckedChange={setShowMaintenance} />
          <Label htmlFor="show-maintenance" className="text-sm text-muted-foreground">Maintenance</Label>
        </div>
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
                maintenanceTasks={maintenanceByStatus[status] ?? []}
                onMaintenanceTaskClick={(t) => { setEditingMaintenanceTask(t); setIsMaintenanceFormOpen(true); }}
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

      <Sheet open={isMaintenanceFormOpen} onOpenChange={setIsMaintenanceFormOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Maintenance Task</SheetTitle>
          </SheetHeader>
          <MaintenanceTaskForm task={editingMaintenanceTask} onClose={() => setIsMaintenanceFormOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
