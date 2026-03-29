"use client"

import { useState } from "react"
import {
  MagnifyingGlass,
  CaretLeft,
  CaretRight,
  CheckCircle,
  XCircle,
  Funnel,
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { KpiCard } from "@/components/admin/kpi-card"
import { AreaChartCard } from "@/components/admin/area-chart-card"
import { trpc } from "@/lib/trpc"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 20

const TEMPLATE_LABELS: Record<string, { label: string; color: string }> = {
  waitlist_confirmation: { label: "Waitlist", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  welcome: { label: "Bienvenue", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  trial_reminder: { label: "Trial J5", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
  trial_expired: { label: "Trial J7", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  launch: { label: "Lancement", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function EmailHistory() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search, 400)
  const [templateFilter, setTemplateFilter] = useState<string | undefined>()
  const [statusFilter, setStatusFilter] = useState<"sent" | "failed" | undefined>()

  const { data, isLoading } = trpc.adminWaitlist.emailHistory.useQuery({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    template: templateFilter,
    status: statusFilter,
  })

  const stats = trpc.adminWaitlist.emailStats.useQuery()

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-4">
              <Skeleton className="mb-2 h-4 w-20" />
              <Skeleton className="h-8 w-12" />
            </div>
          ))
        ) : (
          <>
            <KpiCard label="Total envoyés" value={stats.data?.total ?? 0} />
            <KpiCard label="Délivrés" value={stats.data?.sent ?? 0} />
            <KpiCard label="Échoués" value={stats.data?.failed ?? 0} />
            <KpiCard
              label="Taux de succès"
              value={`${stats.data?.successRate ?? 0}%`}
            />
          </>
        )}
      </div>

      {/* Chart */}
      {stats.data?.daily && stats.data.daily.length > 0 && (
        <AreaChartCard
          title="Emails envoyés (30 jours)"
          data={stats.data.daily}
          color="#D4AF37"
        />
      )}

      {/* Table */}
      <div className="rounded-xl border bg-card">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <MagnifyingGlass className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par email..."
                className="w-64 pl-8"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
              />
            </div>
            <div className="flex items-center gap-1">
              <Funnel className="size-4 text-muted-foreground" />
              {Object.entries(TEMPLATE_LABELS).map(([key, { label }]) => (
                <Badge
                  key={key}
                  variant="outline"
                  className={cn(
                    "cursor-pointer",
                    templateFilter === key
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground"
                  )}
                  onClick={() => {
                    setTemplateFilter(templateFilter === key ? undefined : key)
                    setPage(1)
                  }}
                >
                  {label}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Badge
              variant="outline"
              className={cn(
                "cursor-pointer",
                statusFilter === "sent"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                  : "text-muted-foreground"
              )}
              onClick={() => {
                setStatusFilter(statusFilter === "sent" ? undefined : "sent")
                setPage(1)
              }}
            >
              <CheckCircle weight="fill" className="mr-0.5 size-3" />
              Envoyés
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                "cursor-pointer",
                statusFilter === "failed"
                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                  : "text-muted-foreground"
              )}
              onClick={() => {
                setStatusFilter(statusFilter === "failed" ? undefined : "failed")
                setPage(1)
              }}
            >
              <XCircle weight="fill" className="mr-0.5 size-3" />
              Échoués
            </Badge>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Destinataire</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Envoyé par</TableHead>
              <TableHead className="text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data?.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Aucun email envoyé.
                </TableCell>
              </TableRow>
            ) : (
              data?.items.map((item) => {
                const tpl = TEMPLATE_LABELS[item.template] ?? {
                  label: item.template,
                  color: "bg-muted text-muted-foreground",
                }
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.recipientEmail}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={cn("text-xs", tpl.color)}>
                        {tpl.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.status === "sent" ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle weight="fill" className="size-4" />
                          Envoyé
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 text-red-600 dark:text-red-400"
                          title={item.error ?? undefined}
                        >
                          <XCircle weight="fill" className="size-4" />
                          Échoué
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.senderName ?? "—"}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatDate(item.createdAt)}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-xs text-muted-foreground">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, data.total)} sur {data.total}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <CaretLeft className="size-4" />
              </Button>
              <span className="text-xs text-muted-foreground">
                {page} / {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <CaretRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
