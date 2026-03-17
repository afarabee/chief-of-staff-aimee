import { Settings, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const WIDGET_LABELS: Record<string, string> = {
  briefing: 'Daily Brief',
  weather: 'Weather',
  calendar: "Today's Calendar",
  ideaSpotlight: 'Idea Spotlight',
  news: 'Top AI News',
  podcasts: 'My Podcasts',
};

interface CustomizeDialogProps {
  widgetOrder: string[];
  hiddenWidgets: string[];
  toggleWidget: (id: string) => void;
  moveWidget: (id: string, direction: 'up' | 'down') => void;
}

export function CustomizeDialog({ widgetOrder, hiddenWidgets, toggleWidget, moveWidget }: CustomizeDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="min-h-[44px] gap-2">
          <Settings className="h-4 w-4" /> Customize
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Customize Command Center</DialogTitle>
        </DialogHeader>
        <div className="space-y-1 pt-2">
          {widgetOrder.map((id, idx) => (
            <div key={id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
              <div className="flex flex-col gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  disabled={idx === 0}
                  onClick={() => moveWidget(id, 'up')}
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  disabled={idx === widgetOrder.length - 1}
                  onClick={() => moveWidget(id, 'down')}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </div>
              <span className="flex-1 text-sm font-medium">{WIDGET_LABELS[id] || id}</span>
              <Switch
                checked={!hiddenWidgets.includes(id)}
                onCheckedChange={() => toggleWidget(id)}
              />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
