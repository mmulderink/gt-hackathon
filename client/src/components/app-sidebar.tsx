import { Activity, BarChart3, FileSearch, MessageSquare, Network, Shield, Settings } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";

const menuItems = [
  {
    title: "Query Interface",
    url: "/",
    icon: MessageSquare,
  },
  {
    title: "Visualization",
    url: "/visualization",
    icon: Network,
  },
  {
    title: "Evaluation",
    url: "/evaluation",
    icon: BarChart3,
  },
  {
    title: "Audit Trail",
    url: "/audit",
    icon: FileSearch,
  },
  {
    title: "Compliance",
    url: "/compliance",
    icon: Shield,
  },
  {
    title: "Admin",
    url: "/admin",
    icon: Settings,
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
            <Activity className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-sidebar-foreground">MedGraph AI</h1>
            <p className="text-xs text-muted-foreground">Enterprise KGNN RAG</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild data-active={isActive} data-testid={`link-${item.title.toLowerCase().replace(' ', '-')}`}>
                      <Link href={item.url}>
                        <item.icon className="w-5 h-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
