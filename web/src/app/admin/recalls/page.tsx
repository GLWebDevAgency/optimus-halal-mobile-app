"use client"

import { useState } from "react"
import {
  ShieldWarning,
  Check,
  X,
  Clock,
  CheckCircle,
  XCircle,
  ArrowSquareOut,
  CheckFat,
  ArrowsClockwise,
  Lightning,
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
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

type RecallStatus = "pending" | "approved" | "rejected"

const STATUS_FILTERS: { label: string; value: RecallStatus | undefined }[] = [
  { label: "Tous", value: undefined },
  { label: "En attente", value: "pending" },
  { label: "Approuves", value: "approved" },
  { label: "Rejetes", value: "rejected" },
]

function getStatusBadge(status: string) {
  switch (status) {
    case "pending":
      return (
        <Badge className="bg-warning/10 text-warning-foreground border-warning/20">
          <Clock className="mr-1 size-3" />
          En attente
        </Badge>
      )
    case "approved":
      return (
        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
          <CheckCircle className="mr-1 size-3" />
          Approuve
        </Badge>
      )
    case "rejected":
      return (
        <Badge variant="destructive">
          <XCircle className="mr-1 size-3" />
          Rejete
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function StatCard({
  icon,
  count,
  label,
  color,
  isLoading,
}: {
  icon: React.ReactNode
  count: number
  label: string
  color: string
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <Card size="sm">
        <CardContent className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-10" />
            <Skeleton className="h-3 w-24" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-3">
        <div
          className="flex size-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}15` }}
        >
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold">{count}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function RecallsPage() {
  const [statusFilter, setStatusFilter] = useState<RecallStatus | undefined>(
    "pending",
  )
  const utils = trpc.useUtils()

  const { data, isLoading, refetch } = trpc.recall.adminList.useQuery({
    status: statusFilter,
    limit: 50,
  })

  const approveMutation = trpc.recall.approve.useMutation({
    onSuccess: () => {
      utils.recall.adminList.invalidate()
    },
  })

  const rejectMutation = trpc.recall.reject.useMutation({
    onSuccess: () => {
      utils.recall.adminList.invalidate()
    },
  })

  const bulkApproveMutation = trpc.recall.bulkApprove.useMutation({
    onSuccess: () => {
      utils.recall.adminList.invalidate()
    },
  })

  const [autoApprove, setAutoApprove] = useState(true)

  const syncMutation = trpc.recall.triggerSync.useMutation({
    onSuccess: () => {
      utils.recall.adminList.invalidate()
      utils.recall.syncStatus.invalidate()
    },
  })

  const { data: syncStatus } = trpc.recall.syncStatus.useQuery(undefined, {
    refetchInterval: syncMutation.isPending ? 3000 : false,
  })

  const items = data?.items ?? []
  const counts = data?.counts ?? { pending: 0, approved: 0, rejected: 0 }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Rappels Produit
          </h1>
          <p className="text-muted-foreground">
            Rappels de securite alimentaire RappelConso — moderation et suivi.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {counts.pending > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => bulkApproveMutation.mutate()}
              disabled={bulkApproveMutation.isPending}
            >
              <CheckFat className="mr-1.5 size-4" />
              Tout approuver ({counts.pending})
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => syncMutation.mutate({ autoApprove, fullSync: true })}
            disabled={syncMutation.isPending || syncStatus?.isRunning}
            title="Re-synchronise les 30 derniers jours"
          >
            <ArrowsClockwise
              className={`mr-1.5 size-4 ${syncMutation.isPending ? "animate-spin" : ""}`}
            />
            Full Sync
          </Button>
          <Button
            size="sm"
            onClick={() => syncMutation.mutate({ autoApprove, fullSync: false })}
            disabled={syncMutation.isPending || syncStatus?.isRunning}
          >
            <ArrowsClockwise
              className={`mr-1.5 size-4 ${syncMutation.isPending ? "animate-spin" : ""}`}
            />
            {syncMutation.isPending ? "Sync en cours..." : "Sync RappelConso"}
          </Button>
        </div>
      </div>

      {/* Sync controls card */}
      <Card size="sm">
        <CardContent className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lightning className="size-5 text-amber-500" />
            <div>
              <p className="text-sm font-medium">Approbation automatique</p>
              <p className="text-xs text-muted-foreground">
                {autoApprove
                  ? "Les rappels synchronises sont publies immediatement"
                  : "Les rappels synchronises necessitent une validation manuelle"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setAutoApprove(!autoApprove)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
              autoApprove ? "bg-emerald-500" : "bg-muted"
            }`}
            role="switch"
            aria-checked={autoApprove}
          >
            <span
              className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                autoApprove ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </CardContent>
      </Card>

      {/* Last sync info */}
      {syncStatus?.lastRun && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="size-3" />
          <span>
            Derniere sync :{" "}
            {new Date(syncStatus.lastRun.completedAt).toLocaleString("fr-FR")}{" "}
            — {syncStatus.lastRun.inserted ?? 0} nouveaux,{" "}
            {syncStatus.lastRun.skippedDuplicates ?? 0} doublons
          </span>
          {!syncStatus.lastRun.success && (
            <Badge variant="destructive" className="text-[10px]">
              Echec
            </Badge>
          )}
        </div>
      )}

      {/* Sync result toast */}
      {syncMutation.isSuccess && syncMutation.data?.success && "inserted" in syncMutation.data && (
        <Card size="sm" className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="flex items-center gap-3 text-sm">
            <CheckCircle className="size-5 text-emerald-500" />
            <span>
              Sync terminee : {syncMutation.data.inserted} nouveaux rappels,{" "}
              {syncMutation.data.skippedDuplicates} doublons ignores
              {syncMutation.data.errors > 0 &&
                `, ${syncMutation.data.errors} erreurs`}
            </span>
          </CardContent>
        </Card>
      )}

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Clock className="size-5 text-amber-500" />}
          count={counts.pending}
          label="En attente"
          color="#f59e0b"
          isLoading={isLoading}
        />
        <StatCard
          icon={<CheckCircle className="size-5 text-emerald-500" />}
          count={counts.approved}
          label="Approuves"
          color="#22c55e"
          isLoading={isLoading}
        />
        <StatCard
          icon={<XCircle className="size-5 text-red-500" />}
          count={counts.rejected}
          label="Rejetes"
          color="#ef4444"
          isLoading={isLoading}
        />
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => (
          <Badge
            key={filter.label}
            variant={statusFilter === filter.value ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setStatusFilter(filter.value)}
          >
            {filter.label}
          </Badge>
        ))}
      </div>

      {/* Recalls list */}
      <div className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
              <ShieldWarning className="size-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Aucun rappel{" "}
                {statusFilter === "pending"
                  ? "en attente"
                  : statusFilter === "rejected"
                    ? "rejete"
                    : ""}{" "}
                pour le moment.
              </p>
            </CardContent>
          </Card>
        ) : (
          items.map((recall) => (
            <Card key={recall.id}>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <ShieldWarning className="size-5 text-amber-500" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {getStatusBadge(recall.status)}
                      {recall.autoApproved && (
                        <Badge variant="outline" className="text-xs">
                          Auto
                        </Badge>
                      )}
                      {recall.gtin && (
                        <Badge variant="outline" className="font-mono text-xs">
                          {recall.gtin}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-base">
                      {recall.brandName && (
                        <span className="text-amber-600">
                          {recall.brandName} —{" "}
                        </span>
                      )}
                      {recall.productName ?? recall.recallReason}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {recall.recallReason}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {formatDate(recall.publishedAt)}
                    </div>
                    {recall.sourceUrl && (
                      <a
                        href={recall.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        <ArrowSquareOut className="size-3" />
                        Source
                      </a>
                    )}
                    {recall.healthRisks && (
                      <span className="text-destructive">
                        {recall.healthRisks.length > 60
                          ? `${recall.healthRisks.slice(0, 60)}...`
                          : recall.healthRisks}
                      </span>
                    )}
                  </div>

                  {/* Actions — only for pending recalls */}
                  {recall.status === "pending" && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => rejectMutation.mutate({ id: recall.id })}
                        disabled={rejectMutation.isPending}
                      >
                        <X className="mr-1 size-3.5" />
                        Rejeter
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          approveMutation.mutate({ id: recall.id })
                        }
                        disabled={approveMutation.isPending}
                      >
                        <Check className="mr-1 size-3.5" />
                        Approuver
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
