import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 bg-background">
          <header className="flex h-14 items-center gap-4 border-b px-6">
            <SidebarTrigger className="-ml-2" />
          </header>
          <div className="p-6">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
