"use client"

import {
  Users,
  Scan,
  Database,
  Storefront,
  CrownSimple,
  EnvelopeSimple,
} from "@phosphor-icons/react"
import { Skeleton } from "@/components/ui/skeleton"
import { trpc } from "@/lib/trpc"
import { KpiCard } from "@/components/admin/kpi-card"
import { AreaChartCard } from "@/components/admin/area-chart-card"

const kpiConfig = [
  { key: "totalUsers" as const, label: "Utilisateurs", icon: <Users className="size-4" /> },
  { key: "scansLast30d" as const, label: "Scans (30j)", icon: <Scan className="size-4" /> },
  { key: "totalProducts" as const, label: "Produits en BDD", icon: <Database className="size-4" /> },
  { key: "totalStores" as const, label: "Magasins", icon: <Storefront className="size-4" /> },
  { key: "premiumUsers" as const, label: "Naqiy+", icon: <CrownSimple className="size-4" /> },
  { key: "waitlistLeads" as const, label: "Waitlist", icon: <EnvelopeSimple className="size-4" /> },
]

export default function AdminDashboardPage() {
  const { data, isLoading, error } = trpc.admin.dashboardStats.useQuery()

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-red-400">Erreur de chargement du tableau de bord.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpiConfig.map((kpi) =>
          isLoading ? (
            <div key={kpi.key} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <Skeleton className="mb-2 h-4 w-24 bg-zinc-800" />
              <Skeleton className="h-8 w-16 bg-zinc-800" />
            </div>
          ) : (
            <KpiCard
              key={kpi.key}
              label={kpi.label}
              value={data?.kpis[kpi.key]?.value ?? 0}
              trend={data?.kpis[kpi.key]?.trend}
              icon={kpi.icon}
            />
          )
        )}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {isLoading ? (
          <>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <Skeleton className="mb-4 h-4 w-32 bg-zinc-800" />
              <Skeleton className="h-[220px] w-full bg-zinc-800" />
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <Skeleton className="mb-4 h-4 w-32 bg-zinc-800" />
              <Skeleton className="h-[220px] w-full bg-zinc-800" />
            </div>
          </>
        ) : (
          <>
            <AreaChartCard
              title="Inscriptions (30 jours)"
              data={data?.charts.dailySignups ?? []}
              color="#d4a853"
            />
            <AreaChartCard
              title="Scans (30 jours)"
              data={data?.charts.dailyScans ?? []}
              color="#34d399"
            />
          </>
        )}
      </div>
    </div>
  )
}
