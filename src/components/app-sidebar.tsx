'use client'
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar'

const navItems = [
  { label: 'Recording', href: '/', icon: '🎙' },
  { label: 'Customers', href: '/customers', icon: '👥' },
  { label: 'Karute', href: '/karute', icon: '📋' },
  { label: 'Settings', href: '/settings', icon: '⚙️' },
]

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <span className="font-bold text-lg px-2">Karute</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton render={<a href={item.href} />}>
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}
