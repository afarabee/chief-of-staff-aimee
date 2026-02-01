import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Task, TaskStatus } from '@/types';
import { TaskCard } from './TaskCard';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const statusConfig: Record<TaskStatus, { label: string; headerBg: string; bodyBg: string }> = {
  backlog: { label: 'Backlog', headerBg: 'bg-slate-200 dark:bg-slate-700', bodyBg: 'bg-slate-50 dark:bg-slate-800/30' },
  'to-do': { label: 'To-Do', headerBg: 'bg-sky-200 dark:bg-sky-800', bodyBg: 'bg-sky-50 dark:bg-sky-900/20' },
  'in-progress': { label: 'In Progress', headerBg: 'bg-violet-200 dark:bg-violet-800', bodyBg: 'bg-violet-50 dark:bg-violet-900/20' },
  blocked: { label: 'Blocked', headerBg: 'bg-orange-200 dark:bg-orange-800', bodyBg: 'bg-orange-50 dark:bg-orange-900/20' },
  done: { label: 'Done', headerBg: 'bg-emerald-200 dark:bg-emerald-800', bodyBg: 'bg-emerald-50 dark:bg-emerald-900/20' },
};

export function KanbanColumn({ status, tasks, onTaskClick }: KanbanColumnProps) {
  const config = statusConfig[status];

  return (
    <div className="flex flex-col min-w-[280px] w-[280px] shrink-0">
      <div className={cn('flex items-center gap-2 px-3 py-2.5 rounded-t-lg', config.headerBg)}>
        <h3 className="text-sm font-semibold text-foreground">{config.label}</h3>
        <span className="text-xs text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded-full font-medium">
          {tasks.length}
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
            
            {tasks.length === 0 && !snapshot.isDraggingOver && (
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
