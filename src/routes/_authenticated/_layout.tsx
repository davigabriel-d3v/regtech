import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SidebarProvider, Sidebar, SidebarContent, SidebarInset } from "@/components/ui/sidebar";

export const Route = createFileRoute("/_authenticated/_layout")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="px-4 py-3 text-sm font-semibold text-sidebar-foreground">
              RegTech Admin
            </SidebarGroupLabel>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupContent className="space-y-1 px-2 py-2">
              {[
                { href: "/admin", label: "Dashboard", icon: null },
                { href: "/admin", label: "Pedidos", icon: null },
                { href: "/admin", label: "Produtos", icon: null },
                { href: "/admin", label: "Clientes", icon: null },
                { href: "/admin", label: "Estoque", icon: null },
              ].map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton asChild>
                    <a href={item.href} className="flex items-center gap-2 px-3 py-2 text-sm text-sidebar-foreground rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
                      <span className="flex-1">{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-2">
          <SidebarMenuButton asChild>
            <a href="/conta" className="flex items-center gap-2 px-3 py-2 text-sm text-sidebar-foreground rounded-md hover:bg-sidebar-accent">
              <span>Conta</span>
            </a>
          </SidebarMenuButton>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex-1 overflow-auto">
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
