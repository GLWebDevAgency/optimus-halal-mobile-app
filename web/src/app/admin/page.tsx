"use client"

import {
  Users,
  Scan,
  Database,
  Storefront,
  TrendUp,
  TrendDown,
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

const kpis = [
  {
    label: "Utilisateurs actifs",
    value: "12 847",
    change: "+12.5%",
    trending: "up" as const,
    icon: Users,
  },
  {
    label: "Scans aujourd'hui",
    value: "3 294",
    change: "+8.2%",
    trending: "up" as const,
    icon: Scan,
  },
  {
    label: "Produits en BDD",
    value: "817K",
    change: "+0.3%",
    trending: "up" as const,
    icon: Database,
  },
  {
    label: "Magasins verifies",
    value: "383",
    change: "-2.1%",
    trending: "down" as const,
    icon: Storefront,
  },
]

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

const activeAlerts = [
  {
    title: "Rappel produit : E471 suspect dans lot Brossard",
    severity: "critical" as const,
    date: "18 mars 2026",
  },
  {
    title: "Boycott : nouvelle marque ajoutee a la liste",
    severity: "warning" as const,
    date: "17 mars 2026",
  },
  {
    title: "Mise a jour certificateur AVS",
    severity: "info" as const,
    date: "16 mars 2026",
  },
]

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

export default function AdminDashboardPage() {
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
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-sm font-medium">
                {kpi.label}
              </CardDescription>
              <kpi.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <div className="mt-1 flex items-center gap-1 text-xs">
                {kpi.trending === "up" ? (
                  <TrendUp className="size-3 text-success" />
                ) : (
                  <TrendDown className="size-3 text-destructive" />
                )}
                <span
                  className={
                    kpi.trending === "up"
                      ? "text-success"
                      : "text-destructive"
                  }
                >
                  {kpi.change}
                </span>
                <span className="text-muted-foreground">
                  vs mois dernier
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Scans */}
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
              {activeAlerts.length} alertes en cours.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeAlerts.map((alert) => (
                <div
                  key={alert.title}
                  className={`rounded-lg border p-3 ${getSeverityClasses(alert.severity)}`}
                >
                  <p className="text-sm font-medium">{alert.title}</p>
                  <div className="mt-1 flex items-center gap-1 text-xs opacity-70">
                    <Clock className="size-3" />
                    {alert.date}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
