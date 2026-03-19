"use client"

import { useState } from "react"
import { ShieldCheck, Eye, EyeSlash, CircleNotch } from "@phosphor-icons/react"

import { trpc } from "@/lib/trpc"
import { useAdminAuth } from "@/lib/admin-auth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function AdminLoginPage() {
  const { login, user } = useAdminAuth()
  const utils = trpc.useUtils()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      // Step 1: Store tokens so tRPC client can use them for the next call
      localStorage.setItem("naqiy.access_token", data.accessToken)
      localStorage.setItem("naqiy.refresh_token", data.refreshToken)

      // Step 2: Verify admin status via backend DB
      setIsVerifying(true)
      try {
        const adminInfo = await utils.admin.checkAccess.fetch()
        // Step 3: Admin verified — complete login
        login(
          data.accessToken,
          data.refreshToken,
          {
            id: data.user.id,
            email: data.user.email,
            displayName: data.user.displayName,
          },
          adminInfo.role
        )
      } catch {
        // Not an admin — clean up tokens and show error
        localStorage.removeItem("naqiy.access_token")
        localStorage.removeItem("naqiy.refresh_token")
        setError("Accès refusé — ce compte n'a pas les droits administrateur")
      } finally {
        setIsVerifying(false)
      }
    },
    onError: (err) => {
      setError(err.message || "Identifiants incorrects")
    },
  })

  const isPending = loginMutation.isPending || isVerifying

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    loginMutation.mutate({ email: email.trim(), password })
  }

  // If already logged in, show nothing (redirect handled by auth provider)
  if (user) return null

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-primary">
            <ShieldCheck className="size-6 text-primary-foreground" weight="bold" />
          </div>
          <CardTitle className="text-xl">Naqiy Admin</CardTitle>
          <CardDescription>
            Connectez-vous pour acceder au tableau de bord.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@naqiy.app"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeSlash className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <CircleNotch className="size-4 animate-spin" />
                  {isVerifying ? "Vérification des droits..." : "Connexion..."}
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
