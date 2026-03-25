"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  SquaresFour,
  EnvelopeSimple,
  Package,
  Users,
  Storefront,
  FileText,
  Bell,
  GearSix,
  SignOut,
  CaretDown,
} from "@phosphor-icons/react"

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AdminAuthProvider, useAdminAuth } from "@/lib/admin-auth"

const navItems = [
  { href: "/admin", label: "Vue d'ensemble", icon: SquaresFour, segment: null },
  { href: "/admin/waitlist", label: "Waitlist", icon: EnvelopeSimple, segment: "waitlist" },
  { href: "/admin/users", label: "Utilisateurs", icon: Users, segment: "users" },
  { href: "/admin/products", label: "Produits", icon: Package, segment: "products" },
  { href: "/admin/stores", label: "Magasins", icon: Storefront, segment: "stores" },
  { href: "/admin/articles", label: "Articles", icon: FileText, segment: "articles" },
  { href: "/admin/alerts", label: "Alertes", icon: Bell, segment: "alerts" },
  { href: "/admin/settings", label: "Paramètres", icon: GearSix, segment: "settings" },
]

function getPageTitle(pathname: string): string {
  if (pathname === "/admin") return "Vue d'ensemble"
  const item = navItems.find((i) => i.segment && pathname.startsWith(`/admin/${i.segment}`))
  return item?.label ?? "Admin"
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, isLoading, logout } = useAdminAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="size-6 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      </div>
    )
  }

  if (pathname === "/admin/login") {
    return <>{children}</>
  }

  if (!user) return null

  const initials = user.displayName
    ? user.displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user.email.slice(0, 2).toUpperCase()

  const pageTitle = getPageTitle(pathname)

  return (
    <SidebarProvider defaultOpen={false}>
      <Sidebar collapsible="icon" variant="sidebar" className="border-zinc-800 bg-zinc-950">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gold">
              <span className="text-sm font-bold text-zinc-950">N</span>
            </div>
            <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-semibold text-zinc-50">Naqiy</span>
              <span className="text-xs text-zinc-500">Administration</span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarSeparator className="bg-zinc-800" />

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const isActive =
                    item.segment === null
                      ? pathname === "/admin"
                      : pathname.startsWith(`/admin/${item.segment}`)

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.label}
                        render={<Link href={item.href} />}
                        className={
                          isActive
                            ? "bg-gold/10 text-gold border-l-2 border-gold"
                            : "text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800/50"
                        }
                      >
                        <item.icon weight={isActive ? "fill" : "regular"} />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarSeparator className="bg-zinc-800" />
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Déconnexion"
                onClick={logout}
                className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
              >
                <SignOut />
                <span>Déconnexion</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="bg-zinc-950">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-zinc-800 px-4">
          <SidebarTrigger className="text-zinc-400" />
          <Separator orientation="vertical" className="mx-2 h-4 bg-zinc-800" />

          <h1 className="text-sm font-medium text-zinc-50">{pageTitle}</h1>

          <div className="flex-1" />

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-zinc-800/50 outline-none">
              <Avatar size="sm">
                <AvatarFallback className="bg-zinc-800 text-zinc-300 text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <CaretDown className="size-3 text-zinc-500 hidden sm:block" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">{user.displayName ?? user.email}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  <Badge variant="outline" className="w-fit mt-1 text-[10px]">
                    {user.adminRole === "super_admin" ? "Super Admin" : "Admin"}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-red-400 focus:text-red-400">
                <SignOut className="mr-2 size-4" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminShell>{children}</AdminShell>
    </AdminAuthProvider>
  )
}
