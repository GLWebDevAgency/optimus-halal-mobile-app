"use client"

import {
  Users,
  Scan,
  Database,
  Storefront,
  Warning,
  Clock,
} from "@phosphor-icons/react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { trpc } from "@/lib/trpc"

// --- Mock data (no endpoint available) ---

const recentScans = [
  {
    barcode: "3017620422003",
    product: "Nutella 400g",
    user: "mehdi@example.com",
    verdict: "Douteux",
    time: "il y a 2 min",
  },
  {
    barcode: "3175681851849",
    product: "Evian 1.5L",
    user: "sarah@example.com",
    verdict: "Halal",
    time: "il y a 5 min",
  },
  {
    barcode: "3228857000166",
    product: "Beurre President",
    user: "karim@example.com",
    verdict: "Halal",
    time: "il y a 8 min",
  },
  {
    barcode: "7622210449283",
    product: "Oreo Original",
    user: "fatima@example.com",
    verdict: "Douteux",
    time: "il y a 12 min",
  },
  {
    barcode: "3046920022651",
    product: "Lindt Excellence 70%",
    user: "youssef@example.com",
    verdict: "Haram",
    time: "il y a 15 min",
  },
]

// --- Helpers ---

function formatNumber(n: number): string {
  if (n >= 100_000) {
    const k = Math.round(n / 1_000)
    return `${k.toLocaleString("fr-FR")}K`
  }
  return n.toLocaleString("fr-FR")
}

function getVerdictVariant(verdict: string) {
  switch (verdict) {
    case "Halal":
      return "default" as const
    case "Haram":
      return "destructive" as const
    case "Douteux":
      return "secondary" as const
    default:
      return "outline" as const
  }
}

function getSeverityClasses(severity: "critical" | "warning" | "info") {
  switch (severity) {
    case "critical":
      return "bg-destructive/10 text-destructive border-destructive/20"
    case "warning":
      return "bg-warning/10 text-warning-foreground border-warning/20"
    case "info":
      return "bg-primary/10 text-primary border-primary/20"
  }
}

function getSeverityLabel(severity: "critical" | "warning" | "info") {
  switch (severity) {
    case "critical":
      return "Critique"
    case "warning":
      return "Attention"
    case "info":
      return "Info"
  }
}

function formatDate(dateString: string | Date): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

// --- KPI config (static, values filled from query) ---

const kpiConfig = [
  { key: "totalUsers" as const, label: "Utilisateurs actifs", icon: Users },
  { key: "totalScans" as const, label: "Scans total", icon: Scan },
  { key: "totalProducts" as const, label: "Produits en BDD", icon: Database },
  { key: "totalStores" as const, label: "Magasins verifies", icon: Storefront },
]

export default function AdminDashboardPage() {
  const stats = trpc.stats.global.useQuery()
  const alerts = trpc.alert.list.useQuery({ limit: 3 })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Vue d&apos;ensemble
        </h1>
        <p className="text-muted-foreground">
          Bienvenue sur le tableau de bord Naqiy.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiConfig.map((kpi) => (
          <Card key={kpi.key}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-sm font-medium">
                {kpi.label}
              </CardDescription>
              <kpi.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {stats.isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : stats.error ? (
                <p className="text-sm text-destructive">Erreur de chargement</p>
              ) : (
                <div className="text-2xl font-bold">
                  {formatNumber(stats.data?.[kpi.key] ?? 0)}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Scans (mock) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Scans recents</CardTitle>
            <CardDescription>
              Les 5 derniers scans effectues par les utilisateurs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code-barres</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Verdict</TableHead>
                  <TableHead className="text-right">Heure</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentScans.map((scan) => (
                  <TableRow key={scan.barcode}>
                    <TableCell className="font-mono text-xs">
                      {scan.barcode}
                    </TableCell>
                    <TableCell className="font-medium">
                      {scan.product}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {scan.user}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getVerdictVariant(scan.verdict)}>
                        {scan.verdict}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {scan.time}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Active Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Warning className="size-4 text-warning" />
              Alertes actives
            </CardTitle>
            <CardDescription>
              {alerts.isLoading
                ? "Chargement..."
                : alerts.error
                  ? "Erreur de chargement"
                  : `${alerts.data?.items.length ?? 0} alerte${(alerts.data?.items.length ?? 0) > 1 ? "s" : ""} en cours.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {alerts.isLoading ? (
              <p className="text-sm text-muted-foreground">Chargement...</p>
            ) : alerts.error ? (
              <p className="text-sm text-destructive">
                Impossible de charger les alertes.
              </p>
            ) : alerts.data?.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune alerte active.
              </p>
            ) : (
              <div className="space-y-3">
                {alerts.data?.items.map((alert) => (
                  <div
                    key={alert.id}
                    className={`rounded-lg border p-3 ${getSeverityClasses(alert.severity as "critical" | "warning" | "info")}`}
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <Badge
                        variant={
                          alert.severity === "critical"
                            ? "destructive"
                            : alert.severity === "warning"
                              ? "secondary"
                              : "default"
                        }
                        className="text-[10px]"
                      >
                        {getSeverityLabel(alert.severity as "critical" | "warning" | "info")}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium">{alert.title}</p>
                    <div className="mt-1 flex items-center gap-1 text-xs opacity-70">
                      <Clock className="size-3" />
                      {alert.publishedAt
                        ? formatDate(alert.publishedAt)
                        : formatDate(alert.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
