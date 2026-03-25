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
            <MagnifyingGlass className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
            <Input
              placeholder="Rechercher par email ou nom..."
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
            {tierFilters.map((f) => (
              <Badge
                key={f.label}
                variant="outline"
                className={`cursor-pointer border-zinc-700 ${tierFilter === f.value ? "bg-zinc-700 text-zinc-200" : "text-zinc-500"}`}
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
        <p className="text-xs text-zinc-500">
          {isLoading ? "Chargement..." : `${data?.total.toLocaleString("fr-FR") ?? 0} utilisateurs`}
        </p>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400">Email</TableHead>
              <TableHead className="text-zinc-400">Nom</TableHead>
              <TableHead className="text-zinc-400">Tier</TableHead>
              <TableHead className="text-zinc-400">Madhab</TableHead>
              <TableHead className="text-zinc-400">Scans</TableHead>
              <TableHead className="text-zinc-400">Statut</TableHead>
              <TableHead className="text-right text-zinc-400">Inscrit le</TableHead>
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
                  Aucun utilisateur trouvé.
                </TableCell>
              </TableRow>
            ) : (
              data?.items.map((user) => (
                <TableRow
                  key={user.id}
                  className="cursor-pointer border-zinc-800 hover:bg-zinc-800/30"
                  onClick={() => setSelectedUserId(user.id)}
                >
                  <TableCell className="font-medium text-zinc-200">{user.email}</TableCell>
                  <TableCell className="text-zinc-300">{user.displayName}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        user.subscriptionTier === "premium"
                          ? "border-gold/30 text-gold"
                          : "border-zinc-600 text-zinc-400"
                      }
                    >
                      {user.subscriptionTier === "premium" ? "Naqiy+" : "Free"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-zinc-400">{user.madhab}</TableCell>
                  <TableCell className="font-mono text-zinc-300 tabular-nums">
                    {user.totalScans.toLocaleString("fr-FR")}
                  </TableCell>
                  <TableCell>
                    {user.isActive ? (
                      <span className="text-xs text-emerald-400">Actif</span>
                    ) : (
                      <Badge variant="destructive" className="text-[10px]">Banni</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-zinc-500">
                    {formatDate(user.createdAt)}
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

      {/* Detail Sheet */}
      <UserDetailSheet userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
    </div>
  )
}
