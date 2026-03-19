"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react"
import { useRouter, usePathname } from "next/navigation"
import { trpc } from "./trpc"

type AdminRole = "admin" | "super_admin"

type AdminUser = {
  id: string
  email: string
  displayName: string | null
  adminRole: AdminRole
}

type AdminAuthContextType = {
  user: AdminUser | null
  isLoading: boolean
  login: (accessToken: string, refreshToken: string, user: Omit<AdminUser, "adminRole">, adminRole: AdminRole) => void
  logout: () => void
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null)

function readStoredUser(): AdminUser | null {
  if (typeof window === "undefined") return null
  try {
    const storedUser = localStorage.getItem("naqiy.admin_user")
    const token = localStorage.getItem("naqiy.access_token")
    if (!storedUser || !token) return null
    return JSON.parse(storedUser) as AdminUser
  } catch {
    localStorage.removeItem("naqiy.admin_user")
    return null
  }
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(readStoredUser)
  const mounted = useRef(false)
  const router = useRouter()
  const pathname = usePathname()

  // Re-verify admin status on mount if we have an existing session.
  // This catches cases where the user was removed from admins table.
  const adminCheck = trpc.admin.checkAccess.useQuery(undefined, {
    enabled: !!user,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  })

  // Track mount for hydration-safe redirect
  useEffect(() => {
    mounted.current = true
  }, [])

  // Handle admin verification failure (revoked admin access)
  const adminCheckError = adminCheck.error
  useEffect(() => {
    if (adminCheckError && mounted.current) {
      const code = adminCheckError.data?.code
      if (code === "FORBIDDEN" || code === "UNAUTHORIZED") {
        localStorage.removeItem("naqiy.access_token")
        localStorage.removeItem("naqiy.refresh_token")
        localStorage.removeItem("naqiy.admin_user")
        setUser(null)
      }
    }
  }, [adminCheckError])

  // Redirect to login when not authenticated (only after mount)
  useEffect(() => {
    if (mounted.current && !user && pathname !== "/admin/login") {
      router.replace("/admin/login")
    }
  }, [user, pathname, router])

  const login = useCallback((accessToken: string, refreshToken: string, userData: Omit<AdminUser, "adminRole">, adminRole: AdminRole) => {
    const adminUser: AdminUser = { ...userData, adminRole }
    localStorage.setItem("naqiy.access_token", accessToken)
    localStorage.setItem("naqiy.refresh_token", refreshToken)
    localStorage.setItem("naqiy.admin_user", JSON.stringify(adminUser))
    setUser(adminUser)
    router.replace("/admin")
  }, [router])

  const logout = useCallback(() => {
    localStorage.removeItem("naqiy.access_token")
    localStorage.removeItem("naqiy.refresh_token")
    localStorage.removeItem("naqiy.admin_user")
    setUser(null)
    router.replace("/admin/login")
  }, [router])

  const isLoading = typeof window === "undefined"

  return (
    <AdminAuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider")
  return ctx
}
