"use client"

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

const statusFilters = [
  { label: "Tous", count: 817038, active: true },
  { label: "Halal", count: 6722, active: false },
  { label: "Haram", count: 35852, active: false },
  { label: "Douteux", count: 21649, active: false },
  { label: "Inconnu", count: 756044, active: false },
]

const products = [
  {
    barcode: "3017620422003",
    name: "Nutella",
    brand: "Ferrero",
    status: "Douteux",
    naqiyScore: 42,
    updatedAt: "18/03/2026",
  },
  {
    barcode: "3175681851849",
    name: "Evian 1.5L",
    brand: "Danone",
    status: "Halal",
    naqiyScore: 95,
    updatedAt: "17/03/2026",
  },
  {
    barcode: "3046920022651",
    name: "Excellence Noir 70%",
    brand: "Lindt",
    status: "Haram",
    naqiyScore: 12,
    updatedAt: "16/03/2026",
  },
  {
    barcode: "3228857000166",
    name: "Beurre doux",
    brand: "President",
    status: "Halal",
    naqiyScore: 88,
    updatedAt: "15/03/2026",
  },
  {
    barcode: "7622210449283",
    name: "Oreo Original",
    brand: "Mondelez",
    status: "Inconnu",
    naqiyScore: null,
    updatedAt: "14/03/2026",
  },
]

function getStatusVariant(status: string) {
  switch (status) {
    case "Halal":
      return "default" as const
    case "Haram":
      return "destructive" as const
    case "Douteux":
      return "secondary" as const
    default:
      return "outline" as const
  }
}

function getScoreColor(score: number | null): string {
  if (score === null) return "text-muted-foreground"
  if (score >= 80) return "text-success"
  if (score >= 50) return "text-warning-foreground"
  return "text-destructive"
}

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Produits</h1>
        <p className="text-muted-foreground">
          Gestion des {(817038).toLocaleString("fr-FR")} produits en base de
          donnees.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Catalogue produits</CardTitle>
              <CardDescription>
                Recherchez, filtrez et gerez les produits.
              </CardDescription>
            </div>
            <div className="relative w-full max-w-xs">
              <MagnifyingGlass className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Rechercher par nom ou code-barres..." className="pl-8" />
            </div>
          </div>

          {/* Filter badges */}
          <div className="flex flex-wrap gap-2 pt-2">
            {statusFilters.map((filter) => (
              <Badge
                key={filter.label}
                variant={filter.active ? "default" : "outline"}
                className="cursor-pointer"
              >
                {filter.label}
                <span className="ml-1 opacity-60">
                  ({filter.count.toLocaleString("fr-FR")})
                </span>
              </Badge>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code-barres</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Marque</TableHead>
                <TableHead>Statut Halal</TableHead>
                <TableHead>NaqiyScore</TableHead>
                <TableHead className="text-right">Derniere MAJ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.barcode}>
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
                    <Badge variant={getStatusVariant(product.status)}>
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`font-semibold ${getScoreColor(product.naqiyScore)}`}
                    >
                      {product.naqiyScore !== null
                        ? product.naqiyScore
                        : "N/A"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {product.updatedAt}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination placeholder */}
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">
              Affichage de 1 a 5 sur 817 038 produits
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon-sm" disabled>
                <CaretLeft className="size-4" />
                <span className="sr-only">Page precedente</span>
              </Button>
              <span className="text-sm font-medium">Page 1 / 163 408</span>
              <Button variant="outline" size="icon-sm">
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
