import { Droppable, Draggable } from '@hello-pangea/dnd';
import { format, parseISO } from 'date-fns';
import { Task, TaskStatus } from '@/types';
import { TaskCard } from './TaskCard';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { MaintenanceTask } from '@/types/maintenance';

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  maintenanceTasks?: MaintenanceTask[];
  onMaintenanceTaskClick?: (task: MaintenanceTask) => void;
}

const statusConfig: Record<TaskStatus, { label: string; headerBg: string; bodyBg: string }> = {
  backlog: { label: 'Backlog', headerBg: 'bg-slate-200 dark:bg-slate-700', bodyBg: 'bg-slate-50 dark:bg-slate-800/30' },
  'to-do': { label: 'To-Do', headerBg: 'bg-sky-200 dark:bg-sky-800', bodyBg: 'bg-sky-50 dark:bg-sky-900/20' },
  'in-progress': { label: 'In Progress', headerBg: 'bg-violet-200 dark:bg-violet-800', bodyBg: 'bg-violet-50 dark:bg-violet-900/20' },
  blocked: { label: 'Blocked', headerBg: 'bg-orange-200 dark:bg-orange-800', bodyBg: 'bg-orange-50 dark:bg-orange-900/20' },
  done: { label: 'Done', headerBg: 'bg-emerald-200 dark:bg-emerald-800', bodyBg: 'bg-emerald-50 dark:bg-emerald-900/20' },
};

export function KanbanColumn({ status, tasks, onTaskClick, maintenanceTasks = [], onMaintenanceTaskClick }: KanbanColumnProps) {
  const config = statusConfig[status];
  const totalCount = tasks.length + maintenanceTasks.length;

  return (
    <div className="flex flex-col min-w-[280px] w-[280px] shrink-0">
      <div className={cn('flex items-center gap-2 px-3 py-2.5 rounded-t-lg', config.headerBg)}>
        <h3 className="text-sm font-semibold text-foreground">{config.label}</h3>
        <span className="text-xs text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded-full font-medium">
          {totalCount}
        </span>
      </div>
      
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'flex-1 p-2 space-y-2 rounded-b-lg border border-t-0 min-h-[200px] transition-colors',
              snapshot.isDraggingOver ? 'bg-accent/50' : config.bodyBg
            )}
          >
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={cn(
                      'transition-shadow',
                      snapshot.isDragging && 'shadow-lg'
                    )}
                  >
                    <TaskCard
                      task={task}
                      onClick={() => onTaskClick(task)}
                      showCheckbox={false}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}

            {/* Non-draggable maintenance tasks */}
            {maintenanceTasks.map((mt) => (
              <div
                key={`mt-${mt.id}`}
                className="rounded-lg border bg-card p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => onMaintenanceTaskClick?.(mt)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/50 text-amber-600 dark:text-amber-400">Maintenance</Badge>
                </div>
                <p className="text-sm font-medium truncate">{mt.name}</p>
                {mt.assetName && <p className="text-xs text-muted-foreground truncate">{mt.assetName}</p>}
                {mt.nextDueDate && <p className="text-xs text-muted-foreground mt-1">{format(parseISO(mt.nextDueDate), 'MMM d')}</p>}
              </div>
            ))}
            
            {totalCount === 0 && !snapshot.isDraggingOver && (
              <p className="text-xs text-muted-foreground text-center py-4">
                No tasks
              </p>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
