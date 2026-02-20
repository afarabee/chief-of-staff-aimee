import { useState } from 'react';
import { Plus, CheckSquare, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ResponsiveFormDialog } from '@/components/ui/responsive-dialog';
import { TaskForm } from '@/components/tasks/TaskForm';
import { IdeaForm } from '@/components/ideas/IdeaForm';

type QuickAddType = 'task' | 'idea' | null;

export function QuickAdd() {
  const [openType, setOpenType] = useState<QuickAddType>(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="lg" className="gap-2 min-h-[44px]">
            <Plus className="h-5 w-5" />
            Quick Add
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setOpenType('task')}>
            <CheckSquare className="mr-2 h-4 w-4" />
            New Task
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenType('idea')}>
            <Lightbulb className="mr-2 h-4 w-4" />
            New Idea
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ResponsiveFormDialog open={openType === 'task'} onOpenChange={(open) => !open && setOpenType(null)} title="New Task">
        <TaskForm onClose={() => setOpenType(null)} />
      </ResponsiveFormDialog>

      <ResponsiveFormDialog open={openType === 'idea'} onOpenChange={(open) => !open && setOpenType(null)} title="New Idea">
        <IdeaForm onClose={() => setOpenType(null)} />
      </ResponsiveFormDialog>
    </>
  );
}
