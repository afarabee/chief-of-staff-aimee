import { ReactNode, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Button } from '@/components/ui/button';
import { SearchModal } from '@/components/search/SearchModal';
import { InlineSearch } from '@/components/search/InlineSearch';
import { AIChatBot } from '@/components/chat/AIChatBot';

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
        <main className="flex-1 bg-background">
          <header className="flex h-14 items-center gap-4 border-b px-6">
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
          </header>
          <div className="p-8">{children}</div>
        </main>
      </div>
      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
      <AIChatBot />
    </SidebarProvider>
  );
}
