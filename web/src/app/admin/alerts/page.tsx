"use client"

import { useState } from "react"
import {
  Warning,
  WarningOctagon,
  Info,
  Clock,
} from "@phosphor-icons/react"

import { trpc } from "@/lib/trpc"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

type Severity = "critical" | "warning" | "info"

const severityFilters: { label: string; value: Severity | undefined }[] = [
  { label: "Toutes", value: undefined },
  { label: "Critiques", value: "critical" },
  { label: "Avertissements", value: "warning" },
  { label: "Informations", value: "info" },
]

function getSeverityIcon(severity: Severity) {
  switch (severity) {
    case "critical":
      return <WarningOctagon className="size-5 text-destructive" />
    case "warning":
      return <Warning className="size-5 text-warning" />
    case "info":
      return <Info className="size-5 text-primary" />
  }
}

function getSeverityBadge(severity: Severity) {
  switch (severity) {
    case "critical":
      return <Badge variant="destructive">Critique</Badge>
    case "warning":
      return (
        <Badge className="bg-warning/10 text-warning-foreground border-warning/20">
          Avertissement
        </Badge>
      )
    case "info":
      return <Badge variant="secondary">Information</Badge>
  }
}

function formatDate(publishedAt: Date | string) {
  return new Date(publishedAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default function AlertsPage() {
  const [severity, setSeverity] = useState<Severity | undefined>(undefined)

  const { data, isLoading } = trpc.alert.list.useQuery({
    severity,
    limit: 20,
  })

  const items = data?.items ?? []

  const criticalCount = items.filter((a) => a.severity === "critical").length
  const warningCount = items.filter((a) => a.severity === "warning").length
  const infoCount = items.filter((a) => a.severity === "info").length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Alertes</h1>
        <p className="text-muted-foreground">
          Suivi des alertes de securite alimentaire et notifications.
        </p>
      </div>

      {/* Severity filter badges */}
      <div className="flex flex-wrap gap-2">
        {severityFilters.map((filter) => (
          <Badge
            key={filter.label}
            variant={severity === filter.value ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSeverity(filter.value)}
          >
            {filter.label}
          </Badge>
        ))}
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {isLoading ? (
          <>
            {Array.from({ length: 3 }).map((_, i) => (
              <Card size="sm" key={i}>
                <CardContent className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-7 w-10" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card size="sm">
              <CardContent className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-destructive/10">
                  <WarningOctagon className="size-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{criticalCount}</p>
                  <p className="text-xs text-muted-foreground">Critiques</p>
                </div>
              </CardContent>
            </Card>
            <Card size="sm">
              <CardContent className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-warning/10">
                  <Warning className="size-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{warningCount}</p>
                  <p className="text-xs text-muted-foreground">Avertissements</p>
                </div>
              </CardContent>
            </Card>
            <Card size="sm">
              <CardContent className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <Info className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{infoCount}</p>
                  <p className="text-xs text-muted-foreground">Informations</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Alerts list */}
      <div className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune alerte trouvee.</p>
        ) : (
          items.map((alert) => (
            <Card key={alert.id}>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getSeverityIcon(alert.severity as Severity)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {getSeverityBadge(alert.severity as Severity)}
                    </div>
                    <CardTitle className="text-base">{alert.title}</CardTitle>
                    <CardDescription>{alert.summary}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  {formatDate(alert.publishedAt)}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
