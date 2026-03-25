"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  DeviceMobile,
  Scan,
  ShieldCheck,
  Prohibit,
  Key,
  TrashSimple,
  CrownSimple,
  User as UserIcon,
} from "@phosphor-icons/react"
import { trpc } from "@/lib/trpc"
import { ConfirmDialog } from "./confirm-dialog"

type Props = {
  userId: string | null
  onClose: () => void
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export function UserDetailSheet({ userId, onClose }: Props) {
  const utils = trpc.useUtils()

  const { data, isLoading } = trpc.admin.getUserDetail.useQuery(
    { userId: userId! },
    { enabled: !!userId }
  )

  const updateUser = trpc.admin.updateUser.useMutation({
    onSuccess: () => {
      utils.admin.getUserDetail.invalidate({ userId: userId! })
      utils.admin.listUsers.invalidate()
    },
  })

  const doAction = (action: "ban" | "unban" | "change_tier" | "reset_password" | "delete_gdpr", tier?: "free" | "premium") => {
    if (!userId) return
    updateUser.mutate({ userId, action, tier })
  }

  return (
    <Sheet open={!!userId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>Détail utilisateur</SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-4 px-6 pt-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : !data ? (
          <p className="px-6 pt-2 text-sm text-muted-foreground">Utilisateur introuvable.</p>
        ) : (
          <div className="space-y-6 px-6 pb-6">
            {/* Profile */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                  <UserIcon className="size-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{data.user.displayName}</p>
                  <p className="text-sm text-muted-foreground">{data.user.email}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant="outline" className={data.user.subscriptionTier === "premium" ? "border-primary text-primary" : ""}>
                  {data.user.subscriptionTier === "premium" ? "Naqiy+" : "Free"}
                </Badge>
                <Badge variant="outline">
                  {data.user.madhab}
                </Badge>
                {!data.user.isActive && (
                  <Badge variant="destructive">Banni</Badge>
                )}
                {data.isAdmin && (
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
                    {data.adminRole === "super_admin" ? "Super Admin" : "Admin"}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Scans total</p>
                  <p className="font-mono">{data.user.totalScans}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Streak</p>
                  <p className="font-mono">{data.user.currentStreak}j (max {data.user.longestStreak}j)</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Inscrit le</p>
                  <p>{formatDate(data.user.createdAt)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ville</p>
                  <p>{data.user.city ?? "—"}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Devices */}
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium">
                <DeviceMobile className="size-4" />
                Appareils ({data.devices.length})
              </h4>
              {data.devices.length === 0 ? (
                <p className="text-xs text-muted-foreground">Aucun appareil enregistré.</p>
              ) : (
                <div className="space-y-2">
                  {data.devices.map((d) => (
                    <div key={d.id} className="rounded-lg border bg-card p-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span>{d.platform ?? "?"} — v{d.appVersion ?? "?"}</span>
                        <span className="text-muted-foreground">{d.totalScans} scans</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Recent Scans */}
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium">
                <Scan className="size-4" />
                Scans récents ({data.recentScans.length})
              </h4>
              {data.recentScans.length === 0 ? (
                <p className="text-xs text-muted-foreground">Aucun scan.</p>
              ) : (
                <div className="max-h-48 space-y-1 overflow-y-auto">
                  {data.recentScans.map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded px-2 py-1 text-xs hover:bg-accent">
                      <span>{s.productName ?? s.barcode}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={
                          s.halalStatus === "halal" ? "border-emerald-500/30 text-emerald-400"
                          : s.halalStatus === "haram" ? "border-red-500/30 text-red-400"
                          : ""
                        }>
                          {s.halalStatus ?? "?"}
                        </Badge>
                        <span className="text-muted-foreground">{formatDate(s.scannedAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Admin Actions */}
            <div>
              <h4 className="mb-3 flex items-center gap-1.5 text-sm font-medium">
                <ShieldCheck className="size-4" />
                Actions administrateur
              </h4>
              {updateUser.data?.message && (
                <div className="mb-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
                  {updateUser.data.message}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {data.user.isActive ? (
                  <ConfirmDialog
                    trigger={
                      <Button variant="outline" size="sm" className="border-destructive/50 text-destructive hover:bg-destructive/10">
                        <Prohibit className="mr-1 size-4" />
                        Bannir
                      </Button>
                    }
                    title="Bannir cet utilisateur ?"
                    description={`${data.user.email} sera désactivé et ses sessions révoquées.`}
                    confirmLabel="Bannir"
                    variant="destructive"
                    onConfirm={() => doAction("ban")}
                  />
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                    onClick={() => doAction("unban")}
                  >
                    Réactiver
                  </Button>
                )}

                <ConfirmDialog
                  trigger={
                    <Button variant="outline" size="sm">
                      <CrownSimple className="mr-1 size-4" />
                      {data.user.subscriptionTier === "premium" ? "→ Free" : "→ Naqiy+"}
                    </Button>
                  }
                  title="Changer le tier ?"
                  description={`${data.user.email} passera de ${data.user.subscriptionTier === "premium" ? "Naqiy+" : "Free"} à ${data.user.subscriptionTier === "premium" ? "Free" : "Naqiy+"}. Requiert super_admin.`}
                  confirmLabel="Confirmer"
                  onConfirm={() =>
                    doAction(
                      "change_tier",
                      data.user.subscriptionTier === "premium" ? "free" : "premium"
                    )
                  }
                />

                <ConfirmDialog
                  trigger={
                    <Button variant="outline" size="sm">
                      <Key className="mr-1 size-4" />
                      Reset MDP
                    </Button>
                  }
                  title="Réinitialiser le mot de passe ?"
                  description="Un mot de passe temporaire sera généré. L'utilisateur devra se reconnecter."
                  confirmLabel="Réinitialiser"
                  onConfirm={() => doAction("reset_password")}
                />

                <ConfirmDialog
                  trigger={
                    <Button variant="outline" size="sm" className="border-destructive/50 text-destructive hover:bg-destructive/10">
                      <TrashSimple className="mr-1 size-4" />
                      Supprimer GDPR
                    </Button>
                  }
                  title="Suppression GDPR irréversible"
                  description={`Toutes les données de ${data.user.email} seront définitivement supprimées. Cette action est irréversible.`}
                  confirmLabel="Supprimer définitivement"
                  variant="destructive"
                  onConfirm={() => {
                    doAction("delete_gdpr")
                    onClose()
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
