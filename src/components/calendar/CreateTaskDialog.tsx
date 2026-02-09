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
}

export function CreateTaskDialog({ open, onOpenChange, onSelectType }: CreateTaskDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>What type of task?</DialogTitle>
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
              <div className="font-medium">Maintenance Task</div>
              <div className="text-xs text-muted-foreground">Schedule maintenance work</div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
