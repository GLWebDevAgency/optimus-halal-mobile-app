"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect, createContext, useContext, useCallback } from "react"
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
  Sun,
  Moon,
  ToggleRight,
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
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AdminAuthProvider, useAdminAuth } from "@/lib/admin-auth"

/* ── Admin-scoped theme (isolated from landing) ── */

const STORAGE_KEY = "naqiy.admin_theme"

type AdminTheme = "light" | "dark"

const AdminThemeContext = createContext<{
  theme: AdminTheme
  toggle: () => void
}>({ theme: "light", toggle: () => {} })

function useAdminTheme() {
  return useContext(AdminThemeContext)
}

function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<AdminTheme>(() => {
    if (typeof window === "undefined") return "light"
    const stored = localStorage.getItem(STORAGE_KEY) as AdminTheme | null
    return stored === "dark" || stored === "light" ? stored : "light"
  })
  const [mounted, setMounted] = useState(false)

  // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration guard
  useEffect(() => { setMounted(true) }, [])

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark"
      localStorage.setItem(STORAGE_KEY, next)
      return next
    })
  }, [])

  return (
    <AdminThemeContext.Provider value={{ theme, toggle }}>
      <div
        className={theme === "dark" ? "dark" : ""}
        style={theme === "dark" ? { colorScheme: "dark" } : undefined}
      >
        {mounted ? children : (
          <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </div>
    </AdminThemeContext.Provider>
  )
}

/* ── Nav config ── */

const navItems = [
  { href: "/admin", label: "Vue d'ensemble", icon: SquaresFour, segment: null },
  { href: "/admin/waitlist", label: "Waitlist", icon: EnvelopeSimple, segment: "waitlist" },
  { href: "/admin/users", label: "Utilisateurs", icon: Users, segment: "users" },
  { href: "/admin/products", label: "Produits", icon: Package, segment: "products" },
  { href: "/admin/stores", label: "Magasins", icon: Storefront, segment: "stores" },
  { href: "/admin/articles", label: "Articles", icon: FileText, segment: "articles" },
  { href: "/admin/alerts", label: "Alertes", icon: Bell, segment: "alerts" },
  { href: "/admin/flags", label: "Feature Flags", icon: ToggleRight, segment: "flags" },
  { href: "/admin/settings", label: "Paramètres", icon: GearSix, segment: "settings" },
]

function getPageTitle(pathname: string): string {
  if (pathname === "/admin") return "Vue d'ensemble"
  const item = navItems.find((i) => i.segment && pathname.startsWith(`/admin/${i.segment}`))
  return item?.label ?? "Admin"
}

/* ── Theme toggle button ── */

function ThemeToggle() {
  const { theme, toggle } = useAdminTheme()
  return (
    <button
      onClick={toggle}
      className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
      title={theme === "dark" ? "Mode clair" : "Mode sombre"}
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  )
}

/* ── Shell ── */

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, isLoading, logout } = useAdminAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
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
    <SidebarProvider>
      <Sidebar collapsible="icon" variant="sidebar">
        {/* Logo */}
        <SidebarHeader className="px-3 py-4">
          <Link href="/admin" className="flex items-center gap-2">
            <Image
              src="/images/logo_naqiy.webp"
              alt="Naqiy"
              width={32}
              height={32}
              className="size-8 shrink-0 object-contain"
              priority
            />
            <span className="text-sm font-semibold text-foreground group-data-[collapsible=icon]:hidden">
              Administration
            </span>
          </Link>
        </SidebarHeader>

        {/* Nav */}
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

        {/* Footer */}
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Déconnexion"
                onClick={logout}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <SignOut />
                <span>Déconnexion</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* Main */}
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mx-2 h-4" />
          <h1 className="text-sm font-medium">{pageTitle}</h1>
          <div className="flex-1" />

          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-accent outline-none" />
              }
            >
              <div className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                {initials}
              </div>
              <CaretDown className="size-3 text-muted-foreground hidden sm:block" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user.displayName ?? user.email}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
                <Badge variant="outline" className="w-fit mt-1 text-[10px]">
                  {user.adminRole === "super_admin" ? "Super Admin" : "Admin"}
                </Badge>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={logout}
                className="text-destructive focus:text-destructive"
              >
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
    <AdminThemeProvider>
      <AdminAuthProvider>
        <AdminShell>{children}</AdminShell>
      </AdminAuthProvider>
    </AdminThemeProvider>
  )
}
