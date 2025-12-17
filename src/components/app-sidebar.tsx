"use client"

import {
  LayoutDashboard,
  Users,
  Calendar,
  UserCheck,
  DollarSign,
  CalendarDays,
  FileText,
  BarChart3,
  Settings,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
  SidebarFooter,
} from "@/components/ui/sidebar"

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    title: "Students",
    icon: Users,
    href: "/dashboard/students",
  },
  {
    title: "Classes",
    icon: Calendar,
    href: "/dashboard/classes",
  },
  {
    title: "Attendance",
    icon: UserCheck,
    href: "/dashboard/attendance",
  },
  {
    title: "Staff",
    icon: UserCheck,
    href: "/dashboard/staff",
  },
  {
    title: "Finances",
    icon: DollarSign,
    href: "/dashboard/finances",
  },
  {
    title: "Events",
    icon: CalendarDays,
    href: "/dashboard/events",
  },
  {
    title: "Documents",
    icon: FileText,
    href: "/dashboard/documents",
  },
  {
    title: "Reports",
    icon: BarChart3,
    href: "/dashboard/reports",
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Dance Flow Studio</h2>
            <p className="text-xs text-muted-foreground">Admin Portal</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </Link>
      </SidebarFooter>
    </Sidebar>
  )
}
