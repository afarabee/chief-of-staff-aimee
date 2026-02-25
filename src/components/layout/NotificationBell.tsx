import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useNotifications, type NotificationItem } from '@/hooks/useNotifications';

export function NotificationBell() {
  const { data: notifications = [] } = useNotifications();
  const navigate = useNavigate();
  const count = notifications.length;

  const overdue = notifications.filter((n) => n.urgency === 'overdue');
  const upcoming = notifications.filter((n) => n.urgency === 'upcoming');

  const handleClick = (item: NotificationItem) => {
    navigate(item.link);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
              {count > 99 ? '99+' : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 max-h-96 overflow-y-auto p-0" align="end">
        {count === 0 ? (
          <div className="p-4 text-sm text-muted-foreground text-center">
            No items need attention
          </div>
        ) : (
          <div>
            {overdue.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-semibold text-red-600 bg-red-50 border-b">
                  Overdue ({overdue.length})
                </div>
                {overdue.map((item) => (
                  <NotificationRow key={item.id} item={item} onClick={handleClick} />
                ))}
              </div>
            )}
            {upcoming.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-semibold text-amber-600 bg-amber-50 border-b">
                  Upcoming ({upcoming.length})
                </div>
                {upcoming.map((item) => (
                  <NotificationRow key={item.id} item={item} onClick={handleClick} />
                ))}
              </div>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function NotificationRow({ item, onClick }: { item: NotificationItem; onClick: (item: NotificationItem) => void }) {
  const label =
    item.daysOffset < 0
      ? `${Math.abs(item.daysOffset)} day${Math.abs(item.daysOffset) !== 1 ? 's' : ''} overdue`
      : item.daysOffset === 0
        ? 'Due today'
        : `Due in ${item.daysOffset} day${item.daysOffset !== 1 ? 's' : ''}`;

  return (
    <button
      className="w-full text-left px-4 py-3 hover:bg-muted/50 border-b last:border-b-0 transition-colors"
      onClick={() => onClick(item)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{item.title}</div>
          {item.assetName && (
            <div className="text-xs text-muted-foreground truncate">{item.assetName}</div>
          )}
        </div>
        <Badge variant={item.urgency === 'overdue' ? 'destructive' : 'secondary'} className="text-[10px] shrink-0">
          {item.type === 'task' ? 'Task' : 'Maint.'}
        </Badge>
      </div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </button>
  );
}
