import { GripVertical, ChevronUp, ChevronDown, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';

const NAV_LABELS: Record<string, string> = {
  'command-center': 'Command Center',
  today: 'Today',
  calendar: 'Calendar',
  'shopping-list': 'Shopping List',
  tasks: 'Tasks',
  ideas: 'Ideas',
  categories: 'Categories',
  assets: 'Assets',
  maintenance: 'Maintenance',
  providers: 'Providers',
  'ai-activity': 'AI Activity',
  prescriptions: 'Rx List',
};

interface SidebarCustomizeDialogProps {
  navOrder: string[];
  moveItem: (id: string, direction: 'up' | 'down') => void;
  isCollapsed: boolean;
}

export function SidebarCustomizeDialog({ navOrder, moveItem, isCollapsed }: SidebarCustomizeDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <SidebarMenuItem>
          <SidebarMenuButton tooltip="Customize Nav">
            <Settings className="h-4 w-4" />
            {!isCollapsed && <span>Customize</span>}
          </SidebarMenuButton>
        </SidebarMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Customize Navigation</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Reorder your navigation tabs using the arrows.</p>
        <div className="space-y-1 pt-2">
          {navOrder.map((id, idx) => (
            <div key={id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 text-sm font-medium">{NAV_LABELS[id] || id}</span>
              <div className="flex gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={idx === 0}
                  onClick={() => moveItem(id, 'up')}
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={idx === navOrder.length - 1}
                  onClick={() => moveItem(id, 'down')}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
