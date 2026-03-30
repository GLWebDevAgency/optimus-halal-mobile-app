"use client"

import { useState } from "react"
import {
  MagnifyingGlass,
  CaretLeft,
  CaretRight,
  Trash,
  DownloadSimple,
  Funnel,
  PaperPlaneTilt,
  Users,
  EnvelopeSimple,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { trpc } from "@/lib/trpc"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { KpiCard } from "@/components/admin/kpi-card"
import { AreaChartCard } from "@/components/admin/area-chart-card"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { SendEmailSheet } from "@/components/admin/send-email-sheet"
import { EmailHistory } from "@/components/admin/email-history"

const PAGE_SIZE = 20

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
  const [emailSheetOpen, setEmailSheetOpen] = useState(false)

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

    // Sanitize a cell value for CSV: escape formula injection and quote properly
    const csvCell = (val: string | Date | null | undefined): string => {
      if (val == null) return ""
      let s = val instanceof Date ? val.toISOString() : String(val)
      // Prefix formula-triggering characters with a single quote to neutralize them
      if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
      // If the value contains commas, quotes, or newlines, wrap in double-quotes
      if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`
      return s
    }

    const header = "email,source,locale,utm_source,utm_medium,utm_campaign,created_at"
    const csv = [
      header,
      ...rows.map(
        (r) =>
          [r.email, r.source, r.locale, r.utmSource, r.utmMedium, r.utmCampaign, r.createdAt]
            .map(csvCell)
            .join(",")
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
    <Tabs defaultValue="leads">
      <TabsList variant="line" className="mb-6">
        <TabsTrigger value="leads">
          <Users weight="duotone" className="size-4" />
          Leads
        </TabsTrigger>
        <TabsTrigger value="emails">
          <EnvelopeSimple weight="duotone" className="size-4" />
          Emails envoyés
        </TabsTrigger>
      </TabsList>

      <TabsContent value="leads">
        <div className="space-y-6">
          {/* Stats row */}
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
                  {["landing", "marketplace", "navbar", "cta"].map((src) => (
                    <Badge
                      key={src}
                      variant="outline"
                      className={`cursor-pointer ${sourceFilter === src ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}
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
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEmailSheetOpen(true)}
                    >
                      <PaperPlaneTilt className="mr-1 size-4" />
                      Envoyer un email ({selectedIds.size})
                    </Button>
                    <ConfirmDialog
                      trigger={
                        <Button variant="outline" size="sm" className="border-destructive/50 text-destructive hover:bg-destructive/10">
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
                  </>
                )}
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                  <DownloadSimple className="mr-1 size-4" />
                  Export CSV
                </Button>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={data ? selectedIds.size === data.items.length && data.items.length > 0 : false}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Locale</TableHead>
                  <TableHead>UTM Campaign</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-5 w-20" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : data?.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      Aucun lead trouvé.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.items.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(lead.id)}
                          onCheckedChange={() => toggleSelect(lead.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{lead.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{lead.source}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{lead.locale ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{lead.utmCampaign ?? "—"}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatDate(lead.createdAt)}</TableCell>
                      <TableCell>
                        <ConfirmDialog
                          trigger={
                            <button className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
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

          <SendEmailSheet
            open={emailSheetOpen}
            onOpenChange={setEmailSheetOpen}
            selectedIds={selectedIds}
            onSuccess={() => setSelectedIds(new Set())}
          />
        </div>
      </TabsContent>

      <TabsContent value="emails">
        <EmailHistory />
      </TabsContent>
    </Tabs>
  )
}
