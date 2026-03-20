"use client"

import { useState } from "react"
import { MagnifyingGlass, CaretLeft, CaretRight } from "@phosphor-icons/react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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

const PAGE_SIZE = 20

const tierFilters = [
  { label: "Tous", value: undefined as "free" | "premium" | undefined },
  { label: "Free", value: "free" as const },
  { label: "Naqiy+", value: "premium" as const },
]

function getTierVariant(tier: string) {
  return tier === "premium" ? ("default" as const) : ("secondary" as const)
}

function getTierLabel(tier: string) {
  return tier === "premium" ? "Naqiy+" : "Free"
}

function formatMadhab(madhab: string) {
  const map: Record<string, string> = {
    hanafi: "Hanafi",
    shafii: "Shafi'i",
    maliki: "Maliki",
    hanbali: "Hanbali",
    general: "General",
  }
  return map[madhab] ?? madhab
}

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
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [tierFilter, setTierFilter] = useState<"free" | "premium" | undefined>(undefined)

  const { data, isLoading } = trpc.admin.listUsers.useQuery({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    tier: tierFilter,
  })

  // Simple debounce on search
  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
    // Debounce 400ms
    const timeout = setTimeout(() => setDebouncedSearch(value), 400)
    return () => clearTimeout(timeout)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Utilisateurs</h1>
        <p className="text-muted-foreground">
          Gestion des utilisateurs inscrits sur la plateforme.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Liste des utilisateurs</CardTitle>
              <CardDescription>
                {isLoading
                  ? "Chargement..."
                  : `${data?.total.toLocaleString("fr-FR") ?? 0} utilisateurs inscrits au total.`}
              </CardDescription>
            </div>
            <div className="relative w-full max-w-xs">
              <MagnifyingGlass className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par email ou nom..."
                className="pl-8"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {tierFilters.map((filter) => (
              <Badge
                key={filter.label}
                variant={tierFilter === filter.value ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => {
                  setTierFilter(filter.value)
                  setPage(1)
                }}
              >
                {filter.label}
              </Badge>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Madhab</TableHead>
                <TableHead>Scans</TableHead>
                <TableHead className="text-right">Inscrit le</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Aucun utilisateur trouve.
                  </TableCell>
                </TableRow>
              ) : (
                data?.items.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>{user.displayName}</TableCell>
                    <TableCell>
                      <Badge variant={getTierVariant(user.subscriptionTier)}>
                        {getTierLabel(user.subscriptionTier)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatMadhab(user.madhab)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {user.totalScans.toLocaleString("fr-FR")}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {data && data.totalPages > 0 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Affichage de {(page - 1) * PAGE_SIZE + 1} a{" "}
                {Math.min(page * PAGE_SIZE, data.total)} sur{" "}
                {data.total.toLocaleString("fr-FR")} utilisateurs
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <CaretLeft className="size-4" />
                  <span className="sr-only">Page precedente</span>
                </Button>
                <span className="text-sm font-medium">
                  Page {page} / {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <CaretRight className="size-4" />
                  <span className="sr-only">Page suivante</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
