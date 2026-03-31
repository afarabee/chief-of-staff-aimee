import { Calendar, CalendarCheck, CheckSquare, Lightbulb, LayoutDashboard, Tags, Package, Wrench, Sparkles, ShoppingCart, BrainCircuit, DollarSign, Dumbbell, ExternalLink } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { openExternalUrl } from '@/lib/openExternalUrl';
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
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';

const navItems = [
  { title: 'Command Center', url: '/command-center', icon: BrainCircuit },
  { title: 'Today', url: '/today', icon: LayoutDashboard },
  { title: 'Calendar', url: '/calendar', icon: Calendar },
  { title: 'Shopping List', url: '/shopping-list', icon: ShoppingCart },
  { title: 'Tasks', url: '/tasks', icon: CheckSquare },
  { title: 'Ideas', url: '/ideas', icon: Lightbulb },
  { title: 'Categories', url: '/categories', icon: Tags },
  { title: 'Assets', url: '/assets', icon: Package },
  { title: 'Maintenance', url: '/maintenance', icon: CalendarCheck },
  { title: 'Providers', url: '/providers', icon: Wrench },
  { title: 'AI Activity', url: '/ai-activity', icon: Sparkles },
];

export function AppSidebar() {
  const { state, setOpenMobile, isMobile } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleCfoClick = () => {
    openExternalUrl('https://cfo-for-aimee.lovable.app');
    if (isMobile) setOpenMobile(false);
  };

  const handleWorkoutClick = () => {
    openExternalUrl('https://repsheet.ai-with-aims.studio/');
    if (isMobile) setOpenMobile(false);
  };

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
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="CFO Dashboard" onClick={handleCfoClick}>
                  <DollarSign className="h-4 w-4" />
                  <span className="flex items-center gap-2">
                    CFO Dashboard
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Workout Tracker" onClick={handleWorkoutClick}>
                  <Dumbbell className="h-4 w-4" />
                  <span className="flex items-center gap-2">
                    Workout Tracker
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
