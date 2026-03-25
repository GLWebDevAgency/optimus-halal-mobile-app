"use client"

import { useState } from "react"
import { MagnifyingGlass, CaretLeft, CaretRight } from "@phosphor-icons/react"

import { trpc } from "@/lib/trpc"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
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

const PAGE_SIZE = 20

type HalalStatus = "halal" | "haram" | "doubtful" | "unknown"

const STATUS_FILTERS: {
  label: string
  value: HalalStatus | undefined
}[] = [
  { label: "Tous", value: undefined },
  { label: "Halal", value: "halal" },
  { label: "Haram", value: "haram" },
  { label: "Douteux", value: "doubtful" },
  { label: "Inconnu", value: "unknown" },
]

function getStatusVariant(status: string) {
  switch (status) {
    case "halal":
      return "default" as const
    case "haram":
      return "destructive" as const
    case "doubtful":
      return "secondary" as const
    default:
      return "outline" as const
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "halal":
      return "Halal"
    case "haram":
      return "Haram"
    case "doubtful":
      return "Douteux"
    default:
      return "Inconnu"
  }
}

function getScoreColor(score: number | null): string {
  if (score === null) return "text-muted-foreground"
  if (score >= 80) return "text-success"
  if (score >= 50) return "text-warning-foreground"
  return "text-destructive"
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export default function ProductsPage() {
  const [search, setSearch] = useState("")
  const [halalStatus, setHalalStatus] = useState<HalalStatus | undefined>(undefined)
  const [page, setPage] = useState(0)

  const debouncedSearch = useDebouncedValue(search, 400)

  const offset = page * PAGE_SIZE

  const { data, isLoading, isPlaceholderData } = trpc.product.search.useQuery(
    {
      query: debouncedSearch || undefined,
      halalStatus,
      limit: PAGE_SIZE,
      offset,
    },
    {
      staleTime: 30_000,
      placeholderData: (prev) => prev,
    }
  )

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const rangeStart = total > 0 ? offset + 1 : 0
  const rangeEnd = Math.min(offset + PAGE_SIZE, total)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Produits</h1>
        <p className="text-muted-foreground">
          Gestion des {total.toLocaleString("fr-FR")} produits en base de
          données.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Catalogue produits</CardTitle>
              <CardDescription>
                Recherchez, filtrez et gérez les produits.
              </CardDescription>
            </div>
            <div className="relative w-full max-w-xs">
              <MagnifyingGlass className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou code-barres..."
                className="pl-8"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(0)
                }}
              />
            </div>
          </div>

          {/* Filter badges */}
          <div className="flex flex-wrap gap-2 pt-2">
            {STATUS_FILTERS.map((filter) => (
              <Badge
                key={filter.label}
                variant={halalStatus === filter.value ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => {
                  setHalalStatus(filter.value)
                  setPage(0)
                }}
              >
                {filter.label}
              </Badge>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          <div className={isPlaceholderData ? "opacity-60 transition-opacity" : ""}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code-barres</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Marque</TableHead>
                  <TableHead>Statut Halal</TableHead>
                  <TableHead>Score confiance</TableHead>
                  <TableHead className="text-right">Dernière MAJ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="ml-auto h-4 w-20" /></TableCell>
                      </TableRow>
                    ))}
                  </>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      Aucun produit trouvé.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-mono text-xs">
                        {product.barcode}
                      </TableCell>
                      <TableCell className="font-medium">
                        {product.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {product.brand}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(product.halalStatus)}>
                          {getStatusLabel(product.halalStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`font-semibold ${getScoreColor(product.confidenceScore)}`}>
                          {product.confidenceScore !== null ? product.confidenceScore : "N/A"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {product.updatedAt ? formatDate(product.updatedAt) : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">
              Affichage de {rangeStart} à {rangeEnd} sur{" "}
              {total.toLocaleString("fr-FR")} produits
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                <CaretLeft className="size-4" />
                <span className="sr-only">Page précédente</span>
              </Button>
              <span className="text-sm font-medium">
                Page {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                <CaretRight className="size-4" />
                <span className="sr-only">Page suivante</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
