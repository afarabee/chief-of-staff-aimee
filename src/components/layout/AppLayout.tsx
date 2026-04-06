import { ReactNode, useEffect, useState } from 'react';
import { Search, ExternalLink } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Button } from '@/components/ui/button';
import { SearchModal } from '@/components/search/SearchModal';
import { InlineSearch } from '@/components/search/InlineSearch';
import { AIChatBot } from '@/components/chat/AIChatBot';
import { NotificationBell } from './NotificationBell';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 min-w-0 bg-background overflow-hidden">
          <header className="flex h-14 items-center gap-4 border-b px-4 md:px-6">
            <SidebarTrigger className="-ml-2" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
              <span className="sr-only">Search (⌘K)</span>
            </Button>
            <InlineSearch />
            <div className="ml-auto flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.open(window.location.pathname, '_blank', 'noopener,noreferrer')}
                title="Open in new window"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="sr-only">Open in new window</span>
              </Button>
              <NotificationBell />
            </div>
          </header>
          <div className="p-4 md:p-8">{children}</div>
        </main>
      </div>
      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
      <AIChatBot />
    </SidebarProvider>
  );
}
