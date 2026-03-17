import { Calendar, CalendarCheck, CheckSquare, Lightbulb, LayoutDashboard, Tags, Package, Wrench, Sparkles, ShoppingCart, BrainCircuit } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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
      </SidebarContent>
    </Sidebar>
  );
}
