import { ReactNode, useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchModal } from '@/components/search/SearchModal';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState('');
  const [inlineValue, setInlineValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setInitialQuery('');
        setSearchOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleInlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInlineValue(value);
    if (value.length > 0) {
      setInitialQuery(value);
      setSearchOpen(true);
      setInlineValue('');
      inputRef.current?.blur();
    }
  };

  const handleModalChange = (open: boolean) => {
    setSearchOpen(open);
    if (!open) setInitialQuery('');
  };

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
              onClick={() => { setInitialQuery(''); setSearchOpen(true); }}
            >
              <Search className="h-5 w-5" />
              <span className="sr-only">Search (⌘K)</span>
            </Button>
            <Input
              ref={inputRef}
              value={inlineValue}
              onChange={handleInlineChange}
              placeholder="Search tasks and ideas…"
              className="max-w-xs border-none bg-muted/50 focus-visible:ring-1"
            />
          </header>
          <div className="p-8">{children}</div>
        </main>
      </div>
      <SearchModal open={searchOpen} onOpenChange={handleModalChange} initialQuery={initialQuery} />
    </SidebarProvider>
  );
}
