import { Calendar, CalendarCheck, CheckSquare, Lightbulb, LayoutDashboard, Tags, Package, Wrench, Sparkles, ShoppingCart, BrainCircuit, DollarSign, Dumbbell, ExternalLink, Heart, Bot, Settings, Pill } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { openExternalUrl } from '@/lib/openExternalUrl';
import { useSidebarConfig } from '@/hooks/useSidebarConfig';
import { SidebarCustomizeDialog } from '@/components/layout/SidebarCustomizeDialog';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import type { LucideIcon } from 'lucide-react';

const NAV_ITEMS_MAP: Record<string, { title: string; url: string; icon: LucideIcon }> = {
  'command-center': { title: 'Command Center', url: '/command-center', icon: BrainCircuit },
  today: { title: 'Today', url: '/today', icon: LayoutDashboard },
  calendar: { title: 'Calendar', url: '/calendar', icon: Calendar },
  'shopping-list': { title: 'Shopping List', url: '/shopping-list', icon: ShoppingCart },
  tasks: { title: 'Tasks', url: '/tasks', icon: CheckSquare },
  ideas: { title: 'Ideas', url: '/ideas', icon: Lightbulb },
  categories: { title: 'Categories', url: '/categories', icon: Tags },
  assets: { title: 'Assets', url: '/assets', icon: Package },
  maintenance: { title: 'Maintenance', url: '/maintenance', icon: CalendarCheck },
  providers: { title: 'Providers', url: '/providers', icon: Wrench },
  'ai-activity': { title: 'AI Activity', url: '/ai-activity', icon: Sparkles },
  prescriptions: { title: 'Rx List', url: '/prescriptions', icon: Pill },
};

export function AppSidebar() {
  const { state, setOpenMobile, isMobile } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const { navOrder, moveItem } = useSidebarConfig();

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleExternalClick = (url: string) => {
    openExternalUrl(url);
    if (isMobile) setOpenMobile(false);
  };

  const orderedNavItems = navOrder
    .map((id) => ({ id, ...NAV_ITEMS_MAP[id] }))
    .filter((item) => item.title);

  return (
    <Sidebar
      className="border-r-0 bg-sidebar"
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Calendar className="h-4 w-4" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">Chief of Staff</span>
              <span className="text-xs text-sidebar-foreground/60">Productivity Dashboard</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {orderedNavItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="flex items-center gap-3 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      onClick={handleNavClick}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarCustomizeDialog navOrder={navOrder} moveItem={moveItem} isCollapsed={isCollapsed} />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="CFO Dashboard" onClick={() => handleExternalClick('https://cfo-for-aimee.lovable.app')}>
                  <DollarSign className="h-4 w-4" />
                  <span className="flex items-center gap-2">
                    CFO Dashboard
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Workout Tracker" onClick={() => handleExternalClick('https://repsheet.ai-with-aims.studio/')}>
                  <Dumbbell className="h-4 w-4" />
                  <span className="flex items-center gap-2">
                    Workout Tracker
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Lovable" onClick={() => handleExternalClick('https://lovable.dev')}>
                  <Heart className="h-4 w-4" />
                  <span className="flex items-center gap-2">
                    Lovable
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="AI with Aimee" onClick={() => handleExternalClick('https://ai-with-aims.studio')}>
                  <Bot className="h-4 w-4" />
                  <span className="flex items-center gap-2">
                    AI with Aimee
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="AI with Aimee Admin" onClick={() => handleExternalClick('https://ai-with-aims.studio/admin')}>
                  <Settings className="h-4 w-4" />
                  <span className="flex items-center gap-2">
                    AI with Aimee Admin
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
