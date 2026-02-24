import { format, parseISO } from 'date-fns';
import { CalendarItem, isItemCompleted } from '@/hooks/useCalendarTasks';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface TaskPopoverProps {
  item: CalendarItem;
  onEdit: (item: CalendarItem) => void;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TaskPopover({ item, onEdit, children, open, onOpenChange }: TaskPopoverProps) {
  const completed = isItemCompleted(item);

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 space-y-3" align="start">
        <div className="space-y-1">
          <h4 className="font-semibold text-sm leading-tight">{item.title}</h4>
          <div className="flex flex-wrap gap-1.5">
            <Badge
              variant={item.type === 'kanban' ? 'default' : 'secondary'}
              className={completed ? 'bg-gray-300 text-gray-500' : item.type === 'maintenance' ? 'bg-orange-500 text-white hover:bg-orange-600' : ''}
            >
              {item.type === 'kanban' ? 'Kanban Task' : 'Reminder'}
            </Badge>
            <Badge variant="outline" className="capitalize">{item.status.replace(/_/g, ' ')}</Badge>
            {item.priority && <Badge variant="outline" className="capitalize">{item.priority}</Badge>}
          </div>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>Due: {format(parseISO(item.date), 'PPP')}</p>
          {item.assetName && <p>Asset: {item.assetName}</p>}
        </div>

        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-3">{item.description}</p>
        )}

        <Button size="sm" className="w-full" onClick={() => onEdit(item)}>
          Edit
        </Button>
      </PopoverContent>
    </Popover>
  );
}
