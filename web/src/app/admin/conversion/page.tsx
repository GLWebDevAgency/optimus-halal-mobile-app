"use client"

import {
  UsersThree,
  CrownSimple,
  DeviceMobile,
  ArrowRight,
  Repeat,
  Timer,
  Eye,
  LockSimple,
  Warning,
  CheckCircle,
  Lightning,
} from "@phosphor-icons/react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { trpc } from "@/lib/trpc"
import { KpiCard } from "@/components/admin/kpi-card"

/* ── Helpers ── */

function timeAgo(date: string | Date | null | undefined): string {
  if (!date) return "jamais"
  const diff = Date.now() - new Date(date).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return "< 1h"
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}j`
}

function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—"
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  })
}

/* ── Funnel step ── */

function FunnelStep({
  label,
  value,
  percent,
  colorClass,
  icon,
}: {
  label: string
  value: number
  percent?: number
  colorClass: string
  icon: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
      <div className={`flex size-10 items-center justify-center rounded-full shrink-0 ${colorClass}`}>
        {icon}
      </div>
      <p className="text-xl font-bold text-foreground tabular-nums">
        {value.toLocaleString("fr-FR")}
      </p>
      <p className="text-[11px] text-muted-foreground text-center leading-tight">{label}</p>
      {percent != null && (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-semibold">
          {percent}%
        </Badge>
      )}
    </div>
  )
}

/* ── Page ── */

export default function ConversionPage() {
  const { data, isLoading, error } = trpc.admin.conversionFunnel.useQuery(undefined, {
    staleTime: 2 * 60 * 1000,
  })

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-destructive">Erreur de chargement du funnel.</p>
      </div>
    )
  }

  const kpis = data?.kpis
  const funnel = data?.paywallFunnel

  const impressionToQuota =
    funnel && (funnel.totalPaywallImpressions ?? 0) > 0
      ? Math.round(((funnel.totalQuotaHits ?? 0) / funnel.totalPaywallImpressions) * 100)
      : 0

  const conversionRateFromQuota =
    funnel && (funnel.totalQuotaHits ?? 0) > 0
      ? Math.round(((kpis?.premiumUsers ?? 0) / funnel.totalQuotaHits) * 100)
      : 0

  return (
    <div className="space-y-6">

      {/* ── KPI Grid ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-card p-4">
                <Skeleton className="mb-2 h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))
          : (
            <>
              <KpiCard
                label="Utilisateurs free"
                value={kpis?.freeUsers ?? 0}
                icon={<UsersThree className="size-4" />}
              />
              <KpiCard
                label="Naqiy+ actifs"
                value={kpis?.premiumUsers ?? 0}
                icon={<CrownSimple className="size-4" />}
              />
              <KpiCard
                label="Taux de conversion"
                value={`${kpis?.conversionRate ?? 0}%`}
                icon={<ArrowRight className="size-4" />}
              />
              <KpiCard
                label="Appareils invités"
                value={kpis?.guestDevices ?? 0}
                icon={<DeviceMobile className="size-4" />}
              />
              <KpiCard
                label="Conversions (30j)"
                value={kpis?.recentConversions30d ?? 0}
                icon={<Repeat className="size-4" />}
              />
              <KpiCard
                label="Essais en cours"
                value={kpis?.trial?.activeTrial ?? 0}
                icon={<Timer className="size-4" />}
              />
            </>
          )}
      </div>

      {/* ── Paywall Funnel ── */}
      <div className="rounded-xl border bg-card p-6">
        <div className="mb-1">
          <h2 className="text-sm font-semibold text-foreground">Funnel paywall</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Utilisateurs inscrits — agrégats cumulés</p>
        </div>

        {isLoading ? (
          <div className="flex items-start gap-4 mt-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 flex-1">
                <Skeleton className="size-10 rounded-full" />
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-1 mt-6 overflow-x-auto pb-2">
            <FunnelStep
              label="Vus paywall"
              value={funnel?.usersWithPaywallSeen ?? 0}
              colorClass="bg-sky-500/10 text-sky-500"
              icon={<Eye className="size-4" />}
            />
            <ArrowRight className="size-4 text-muted-foreground/30 shrink-0" />
            <FunnelStep
              label="Impressions totales"
              value={funnel?.totalPaywallImpressions ?? 0}
              colorClass="bg-violet-500/10 text-violet-500"
              icon={<Repeat className="size-4" />}
            />
            <ArrowRight className="size-4 text-muted-foreground/30 shrink-0" />
            <FunnelStep
              label="Feature bloquée"
              value={funnel?.totalFeatureBlocks ?? 0}
              colorClass="bg-orange-500/10 text-orange-500"
              icon={<LockSimple className="size-4" />}
            />
            <ArrowRight className="size-4 text-muted-foreground/30 shrink-0" />
            <FunnelStep
              label="Quota atteint"
              value={funnel?.totalQuotaHits ?? 0}
              percent={impressionToQuota}
              colorClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
              icon={<Warning className="size-4" />}
            />
            <ArrowRight className="size-4 text-muted-foreground/30 shrink-0" />
            <FunnelStep
              label="Convertis"
              value={kpis?.premiumUsers ?? 0}
              percent={conversionRateFromQuota}
              colorClass="bg-emerald-500/10 text-emerald-500"
              icon={<CheckCircle className="size-4" />}
            />
          </div>
        )}
      </div>

      {/* ── Trial Stats ── */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-sm font-semibold text-foreground mb-5">Essais (appareils)</h2>
        {isLoading ? (
          <div className="grid grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="mb-1.5 h-7 w-12" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-2xl font-bold text-emerald-500 tabular-nums">
                {(kpis?.trial?.activeTrial ?? 0).toLocaleString("fr-FR")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">En cours</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400 tabular-nums">
                {(kpis?.trial?.expiredUnconverted ?? 0).toLocaleString("fr-FR")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Expirés non convertis</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground tabular-nums">
                {(kpis?.trial?.converted ?? 0).toLocaleString("fr-FR")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Convertis</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Hot Free Users ── */}
      <div className="rounded-xl border bg-card">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <div className="flex items-center gap-2">
              <Lightning className="size-4 text-amber-500" weight="fill" />
              <h2 className="text-sm font-semibold text-foreground">Utilisateurs chauds</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Free · quota_hits ≥ 2 · actifs ces 7 derniers jours
            </p>
          </div>
          {data && (
            <Badge variant="secondary" className="tabular-nums">
              {data.hotFreeUsers.length}
            </Badge>
          )}
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : (data?.hotFreeUsers.length ?? 0) === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">Aucun utilisateur chaud pour le moment.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Scans</TableHead>
                <TableHead className="text-right">Quota hits</TableHead>
                <TableHead className="text-right">Paywall vu</TableHead>
                <TableHead className="text-right">Bloqué</TableHead>
                <TableHead className="text-right">Actif il y a</TableHead>
                <TableHead className="text-right">Inscrit le</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.hotFreeUsers.map((u) => (
                <TableRow key={u.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium text-xs max-w-[200px] truncate">
                    {u.email}
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums">
                    {u.totalScans ?? 0}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="destructive"
                      className="text-[10px] px-1.5 py-0 tabular-nums"
                    >
                      {u.quotaHitsCount}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                    {u.paywallSeenCount}
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                    {u.featureBlockedCount}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {timeAgo(u.lastActiveAt)}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {formatDate(u.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* ── Hot Guest Devices ── */}
      <div className="rounded-xl border bg-card">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <div className="flex items-center gap-2">
              <Lightning className="size-4 text-amber-500" weight="fill" />
              <h2 className="text-sm font-semibold text-foreground">Appareils invités chauds</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Anonymes · quota_hits ≥ 2 · actifs ces 7 derniers jours
            </p>
          </div>
          {data && (
            <Badge variant="secondary" className="tabular-nums">
              {data.hotGuestDevices.length}
            </Badge>
          )}
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : (data?.hotGuestDevices.length ?? 0) === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">Aucun appareil invité chaud pour le moment.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device ID</TableHead>
                <TableHead>Plateforme</TableHead>
                <TableHead className="text-right">Scans</TableHead>
                <TableHead className="text-right">Quota hits</TableHead>
                <TableHead className="text-right">Paywall vu</TableHead>
                <TableHead className="text-right">Essai expire</TableHead>
                <TableHead className="text-right">Actif il y a</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.hotGuestDevices.map((d) => (
                <TableRow key={d.deviceId} className="hover:bg-muted/30">
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {d.deviceId.slice(0, 16)}…
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {d.platform ?? "?"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums">
                    {d.totalScans ?? 0}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="destructive"
                      className="text-[10px] px-1.5 py-0 tabular-nums"
                    >
                      {d.quotaHitsCount}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                    {d.paywallSeenCount}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {formatDate(d.trialExpiresAt)}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {timeAgo(d.lastActiveAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
