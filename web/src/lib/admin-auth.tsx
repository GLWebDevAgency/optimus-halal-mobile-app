"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
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
  const [storedUser, setStoredUser] = useState<AdminUser | null>(readStoredUser)
  const [isMounted, setIsMounted] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => setIsMounted(true), [])

  // Re-verify admin status on mount and on window focus.
  // This catches cases where the user was removed from admins table.
  const adminCheck = trpc.admin.checkAccess.useQuery(undefined, {
    enabled: !!storedUser,
    retry: false,
    refetchOnWindowFocus: true,
    staleTime: 60_000, // 1 min — faster detection of revoked access
  })

  // Derive effective user: if admin check failed with FORBIDDEN/UNAUTHORIZED,
  // the session is revoked — user is null. No setState in effect needed.
  const isRevoked = useMemo(() => {
    if (!adminCheck.error) return false
    const code = adminCheck.error.data?.code
    return code === "FORBIDDEN" || code === "UNAUTHORIZED"
  }, [adminCheck.error])

  const user = isRevoked ? null : storedUser

  // Clean up localStorage when access is revoked (external system sync, not state)
  useEffect(() => {
    if (isRevoked) {
      localStorage.removeItem("naqiy.access_token")
      localStorage.removeItem("naqiy.refresh_token")
      localStorage.removeItem("naqiy.admin_user")
    }
  }, [isRevoked])

  // Redirect to login when not authenticated (only after mount)
  useEffect(() => {
    if (isMounted && !user && pathname !== "/admin/login") {
      router.replace("/admin/login")
    }
  }, [isMounted, user, pathname, router])

  const login = useCallback((accessToken: string, refreshToken: string, userData: Omit<AdminUser, "adminRole">, adminRole: AdminRole) => {
    const adminUser: AdminUser = { ...userData, adminRole }
    localStorage.setItem("naqiy.access_token", accessToken)
    localStorage.setItem("naqiy.refresh_token", refreshToken)
    localStorage.setItem("naqiy.admin_user", JSON.stringify(adminUser))
    setStoredUser(adminUser)
    router.replace("/admin")
  }, [router])

  const logout = useCallback(() => {
    localStorage.removeItem("naqiy.access_token")
    localStorage.removeItem("naqiy.refresh_token")
    localStorage.removeItem("naqiy.admin_user")
    setStoredUser(null)
    router.replace("/admin/login")
  }, [router])

  const isLoading = !isMounted

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
