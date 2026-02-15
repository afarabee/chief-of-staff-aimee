import { format } from 'date-fns';
import { CheckSquare, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectType: (type: 'kanban' | 'maintenance') => void;
  date?: Date | null;
}

export function CreateTaskDialog({ open, onOpenChange, onSelectType, date }: CreateTaskDialogProps) {
  const title = date ? `New Task for ${format(date, 'MMM d, yyyy')}` : 'New Task';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Choose which type of task to create.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-2">
          <Button
            variant="outline"
            className="h-auto py-3 justify-start gap-3"
            onClick={() => onSelectType('kanban')}
          >
            <CheckSquare className="h-5 w-5 text-primary" />
            <div className="text-left">
              <div className="font-medium">Kanban Task</div>
              <div className="text-xs text-muted-foreground">Add to your task board</div>
            </div>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-3 justify-start gap-3"
            onClick={() => onSelectType('maintenance')}
          >
            <ClipboardCheck className="h-5 w-5 text-orange-500" />
            <div className="text-left">
              <div className="font-medium">Reminder</div>
              <div className="text-xs text-muted-foreground">Schedule a maintenance reminder</div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
