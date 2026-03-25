"use client"

import { useState } from "react"
import {
  MagnifyingGlass,
  CaretLeft,
  CaretRight,
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
import { trpc } from "@/lib/trpc"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { UserDetailSheet } from "@/components/admin/user-detail-sheet"

const PAGE_SIZE = 20

const tierFilters = [
  { label: "Tous", value: undefined as "free" | "premium" | undefined },
  { label: "Free", value: "free" as const },
  { label: "Naqiy+", value: "premium" as const },
]

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export default function UsersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search, 400)
  const [tierFilter, setTierFilter] = useState<"free" | "premium" | undefined>()
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const { data, isLoading } = trpc.admin.listUsers.useQuery({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    tier: tierFilter,
  })

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <MagnifyingGlass className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par email ou nom..."
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
            {tierFilters.map((f) => (
              <Badge
                key={f.label}
                variant="outline"
                className={`cursor-pointer ${tierFilter === f.value ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}
                onClick={() => {
                  setTierFilter(f.value)
                  setPage(1)
                }}
              >
                {f.label}
              </Badge>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {isLoading ? "Chargement..." : `${data?.total.toLocaleString("fr-FR") ?? 0} utilisateurs`}
        </p>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Email</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Madhab</TableHead>
              <TableHead>Scans</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Inscrit le</TableHead>
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
                  Aucun utilisateur trouvé.
                </TableCell>
              </TableRow>
            ) : (
              data?.items.map((user) => (
                <TableRow
                  key={user.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedUserId(user.id)}
                >
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.displayName}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        user.subscriptionTier === "premium"
                          ? "border-primary/30 text-primary"
                          : ""
                      }
                    >
                      {user.subscriptionTier === "premium" ? "Naqiy+" : "Free"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.madhab}</TableCell>
                  <TableCell className="font-mono tabular-nums">
                    {user.totalScans.toLocaleString("fr-FR")}
                  </TableCell>
                  <TableCell>
                    {user.isActive ? (
                      <span className="text-xs text-emerald-400">Actif</span>
                    ) : (
                      <Badge variant="destructive" className="text-[10px]">Banni</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatDate(user.createdAt)}
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

      {/* Detail Sheet */}
      <UserDetailSheet userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
    </div>
  )
}
