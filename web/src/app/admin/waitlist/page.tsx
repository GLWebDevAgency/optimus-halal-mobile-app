"use client"

import { useState } from "react"
import {
  MagnifyingGlass,
  CaretLeft,
  CaretRight,
  Trash,
  DownloadSimple,
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
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { trpc } from "@/lib/trpc"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { KpiCard } from "@/components/admin/kpi-card"
import { AreaChartCard } from "@/components/admin/area-chart-card"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"

const PAGE_SIZE = 20

const sourceColors: Record<string, string> = {
  landing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  marketplace: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  navbar: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  cta: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
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

export default function WaitlistPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search, 400)
  const [sourceFilter, setSourceFilter] = useState<string | undefined>()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const utils = trpc.useUtils()

  const { data, isLoading } = trpc.adminWaitlist.list.useQuery({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    source: sourceFilter,
  })

  const stats = trpc.adminWaitlist.stats.useQuery()
  const exportQuery = trpc.adminWaitlist.export.useQuery(undefined, { enabled: false })

  const deleteMutation = trpc.adminWaitlist.delete.useMutation({
    onSuccess: () => {
      utils.adminWaitlist.list.invalidate()
      utils.adminWaitlist.stats.invalidate()
    },
  })

  const bulkDeleteMutation = trpc.adminWaitlist.deleteBulk.useMutation({
    onSuccess: () => {
      setSelectedIds(new Set())
      utils.adminWaitlist.list.invalidate()
      utils.adminWaitlist.stats.invalidate()
    },
  })

  const handleExportCSV = async () => {
    const result = await exportQuery.refetch()
    if (!result.data) return
    const rows = result.data
    const header = "email,source,locale,utm_source,utm_medium,utm_campaign,created_at"
    const csv = [
      header,
      ...rows.map(
        (r) =>
          `${r.email},${r.source},${r.locale ?? ""},${r.utmSource ?? ""},${r.utmMedium ?? ""},${r.utmCampaign ?? ""},${r.createdAt}`
      ),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `naqiy-waitlist-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (!data) return
    if (selectedIds.size === data.items.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(data.items.map((i) => i.id)))
    }
  }

  const sources = stats.data?.bySource ?? []

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <Skeleton className="mb-2 h-4 w-20 bg-zinc-800" />
              <Skeleton className="h-8 w-12 bg-zinc-800" />
            </div>
          ))
        ) : (
          <>
            <KpiCard label="Total inscrits" value={stats.data?.total ?? 0} />
            {sources.slice(0, 3).map((s) => (
              <KpiCard key={s.source} label={`Source: ${s.source}`} value={s.count} />
            ))}
          </>
        )}
      </div>

      {/* Chart */}
      {stats.data?.daily && stats.data.daily.length > 0 && (
        <AreaChartCard
          title="Inscriptions waitlist (30 jours)"
          data={stats.data.daily}
          color="#60a5fa"
        />
      )}

      {/* Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50">
        <div className="flex flex-col gap-3 border-b border-zinc-800 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <MagnifyingGlass className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              <Input
                placeholder="Rechercher par email..."
                className="w-64 border-zinc-700 bg-zinc-800/50 pl-8 text-zinc-200 placeholder:text-zinc-500"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
              />
            </div>
            <div className="flex items-center gap-1">
              <Funnel className="size-4 text-zinc-500" />
              {["landing", "marketplace", "navbar", "cta"].map((src) => (
                <Badge
                  key={src}
                  variant="outline"
                  className={`cursor-pointer border-zinc-700 ${sourceFilter === src ? "bg-zinc-700 text-zinc-200" : "text-zinc-500"}`}
                  onClick={() => {
                    setSourceFilter(sourceFilter === src ? undefined : src)
                    setPage(1)
                  }}
                >
                  {src}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <ConfirmDialog
                trigger={
                  <Button variant="outline" size="sm" className="border-red-800 text-red-400 hover:bg-red-500/10">
                    <Trash className="mr-1 size-4" />
                    Supprimer ({selectedIds.size})
                  </Button>
                }
                title="Supprimer les leads sélectionnés ?"
                description={`${selectedIds.size} lead(s) seront supprimés définitivement.`}
                confirmLabel="Supprimer"
                variant="destructive"
                onConfirm={() => bulkDeleteMutation.mutate({ ids: [...selectedIds] })}
              />
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="border-zinc-700 text-zinc-300"
            >
              <DownloadSimple className="mr-1 size-4" />
              Export CSV
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="w-10">
                <Checkbox
                  checked={data ? selectedIds.size === data.items.length && data.items.length > 0 : false}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="text-zinc-400">Email</TableHead>
              <TableHead className="text-zinc-400">Source</TableHead>
              <TableHead className="text-zinc-400">Locale</TableHead>
              <TableHead className="text-zinc-400">UTM Campaign</TableHead>
              <TableHead className="text-right text-zinc-400">Date</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-zinc-800">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-20 bg-zinc-800" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data?.items.length === 0 ? (
              <TableRow className="border-zinc-800">
                <TableCell colSpan={7} className="py-8 text-center text-zinc-500">
                  Aucun lead trouvé.
                </TableCell>
              </TableRow>
            ) : (
              data?.items.map((lead) => (
                <TableRow key={lead.id} className="border-zinc-800 hover:bg-zinc-800/30">
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(lead.id)}
                      onCheckedChange={() => toggleSelect(lead.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-zinc-200">{lead.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={sourceColors[lead.source] ?? "text-zinc-400"}>
                      {lead.source}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-zinc-400">{lead.locale ?? "—"}</TableCell>
                  <TableCell className="text-zinc-400">{lead.utmCampaign ?? "—"}</TableCell>
                  <TableCell className="text-right text-zinc-500">{formatDate(lead.createdAt)}</TableCell>
                  <TableCell>
                    <ConfirmDialog
                      trigger={
                        <button className="rounded p-1 text-zinc-500 hover:bg-red-500/10 hover:text-red-400">
                          <Trash className="size-4" />
                        </button>
                      }
                      title="Supprimer ce lead ?"
                      description={`${lead.email} sera supprimé définitivement.`}
                      confirmLabel="Supprimer"
                      variant="destructive"
                      onConfirm={() => deleteMutation.mutate({ id: lead.id })}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-3">
            <p className="text-xs text-zinc-500">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, data.total)} sur {data.total}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="border-zinc-700 text-zinc-400"
              >
                <CaretLeft className="size-4" />
              </Button>
              <span className="text-xs text-zinc-400">
                {page} / {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="border-zinc-700 text-zinc-400"
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
