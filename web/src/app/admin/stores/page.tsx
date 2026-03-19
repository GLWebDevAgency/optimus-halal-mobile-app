"use client"

import { useState, useEffect } from "react"
import { MagnifyingGlass, CaretLeft, CaretRight, MapPin, Star } from "@phosphor-icons/react"
import { trpc } from "@/lib/trpc"

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

// ---------------------------------------------------------------------------
// Constants & mappings
// ---------------------------------------------------------------------------

const LIMIT = 20

const typeFilters = [
  { label: "Tous", value: undefined },
  { label: "Boucherie", value: "butcher" },
  { label: "Epicerie", value: "supermarket" },
  { label: "Restaurant", value: "restaurant" },
  { label: "Boulangerie", value: "bakery" },
] as const

const storeTypeLabels: Record<string, string> = {
  butcher: "Boucherie",
  supermarket: "Supermarché",
  restaurant: "Restaurant",
  bakery: "Boulangerie",
  abattoir: "Abattoir",
  wholesaler: "Grossiste",
  online: "En ligne",
  other: "Autre",
}

const certifierLabels: Record<string, string> = {
  avs: "AVS",
  achahada: "Achahada",
  argml: "ARGML",
  mosquee_de_paris: "Mosquée de Paris",
  mosquee_de_lyon: "Mosquée de Lyon",
  other: "Autre",
  none: "Aucun",
}

function getTypeVariant(storeType: string) {
  switch (storeType) {
    case "butcher":
      return "default" as const
    case "supermarket":
    case "restaurant":
      return "secondary" as const
    default:
      return "outline" as const
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function StoresPage() {
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [storeType, setStoreType] = useState<"supermarket" | "butcher" | "restaurant" | "bakery" | "abattoir" | "wholesaler" | "online" | "other" | undefined>(undefined)
  const [page, setPage] = useState(0)

  // Debounce search query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
      setPage(0)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const offset = page * LIMIT

  const { data, isLoading } = trpc.store.search.useQuery({
    query: debouncedQuery,
    storeType,
    limit: LIMIT,
    offset,
  })

  const total = data?.total ?? 0
  const stores = data?.items ?? []
  const totalPages = Math.max(1, Math.ceil(total / LIMIT))
  const from = total === 0 ? 0 : offset + 1
  const to = Math.min(offset + LIMIT, total)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Magasins</h1>
        <p className="text-muted-foreground">
          Gestion des {total.toLocaleString("fr-FR")} magasins.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Liste des magasins</CardTitle>
              <CardDescription>
                Recherchez, filtrez et consultez les magasins.
              </CardDescription>
            </div>
            <div className="relative w-full max-w-xs">
              <MagnifyingGlass className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou adresse..."
                className="pl-8"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Type filter badges */}
          <div className="flex flex-wrap gap-2 pt-2">
            {typeFilters.map((filter) => (
              <Badge
                key={filter.label}
                variant={storeType === filter.value ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => { setStoreType(filter.value); setPage(0) }}
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
                <TableHead>Nom</TableHead>
                <TableHead>Adresse</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Certificateur</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="text-right">Avis</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="ml-auto h-4 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : stores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Aucun magasin trouvé.
                  </TableCell>
                </TableRow>
              ) : (
                stores.map((store) => (
                  <TableRow key={store.id}>
                    <TableCell className="font-medium">{store.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="size-3 shrink-0" />
                        <span className="max-w-[250px] truncate">
                          {[store.address, store.city].filter(Boolean).join(", ")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTypeVariant(store.storeType)}>
                        {storeTypeLabels[store.storeType] ?? store.storeType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {certifierLabels[store.certifier] ?? store.certifier}
                    </TableCell>
                    <TableCell>
                      {store.averageRating ? (
                        <div className="flex items-center gap-1">
                          <Star className="size-3 text-primary" weight="fill" />
                          <span className="font-medium">{store.averageRating}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">&mdash;</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {store.reviewCount ?? 0}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">
              {total === 0
                ? "Aucun résultat"
                : `Affichage de ${from} à ${to} sur ${total.toLocaleString("fr-FR")} magasins`}
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
                Page {page + 1} / {totalPages.toLocaleString("fr-FR")}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                disabled={page + 1 >= totalPages}
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
