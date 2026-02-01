import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Task, TaskStatus } from '@/types';
import { TaskCard } from './TaskCard';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const statusConfig: Record<TaskStatus, { label: string; color: string }> = {
  backlog: { label: 'Backlog', color: 'bg-muted' },
  'to-do': { label: 'To-Do', color: 'bg-primary/10' },
  'in-progress': { label: 'In Progress', color: 'bg-blue-500/10' },
  blocked: { label: 'Blocked', color: 'bg-destructive/10' },
  done: { label: 'Done', color: 'bg-green-500/10' },
};

export function KanbanColumn({ status, tasks, onTaskClick }: KanbanColumnProps) {
  const config = statusConfig[status];

  return (
    <div className="flex flex-col min-w-[280px] w-[280px] shrink-0">
      <div className={cn('flex items-center gap-2 px-3 py-2 rounded-t-lg', config.color)}>
        <h3 className="text-sm font-semibold text-foreground">{config.label}</h3>
        <span className="text-xs text-muted-foreground bg-background/50 px-1.5 py-0.5 rounded">
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
              snapshot.isDraggingOver ? 'bg-accent/50' : 'bg-muted/30'
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
