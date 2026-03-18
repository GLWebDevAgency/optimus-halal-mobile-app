import { Search, ChevronLeft, ChevronRight, MapPin, Star } from "lucide-react"

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

const typeFilters = [
  { label: "Tous", active: true },
  { label: "Boucherie", active: false },
  { label: "Epicerie", active: false },
  { label: "Supermarche", active: false },
  { label: "Restaurant", active: false },
]

const stores = [
  {
    name: "Boucherie Al Baraka",
    address: "12 rue de la Republique, 93100 Montreuil",
    type: "Boucherie",
    certifier: "AVS",
    rating: 4.6,
    googlePlaceId: "ChIJ...abc",
  },
  {
    name: "Epicerie Salam",
    address: "45 av. Jean Jaures, 75019 Paris",
    type: "Epicerie",
    certifier: "Achahada",
    rating: 4.2,
    googlePlaceId: "ChIJ...def",
  },
  {
    name: "Istanbul Market",
    address: "8 bd de Strasbourg, 75010 Paris",
    type: "Supermarche",
    certifier: "AVS",
    rating: 4.8,
    googlePlaceId: "ChIJ...ghi",
  },
  {
    name: "Le Mezze Libanais",
    address: "23 rue du Faubourg Saint-Denis, 75010 Paris",
    type: "Restaurant",
    certifier: "Aucun",
    rating: 3.9,
    googlePlaceId: "ChIJ...jkl",
  },
  {
    name: "Boucherie du Maghreb",
    address: "67 av. de Flandre, 75019 Paris",
    type: "Boucherie",
    certifier: "AVS",
    rating: 4.4,
    googlePlaceId: "ChIJ...mno",
  },
]

function getTypeVariant(type: string) {
  switch (type) {
    case "Boucherie":
      return "default" as const
    case "Epicerie":
      return "secondary" as const
    case "Supermarche":
      return "outline" as const
    case "Restaurant":
      return "secondary" as const
    default:
      return "outline" as const
  }
}

export default function StoresPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Magasins</h1>
        <p className="text-muted-foreground">
          Gestion des 383 magasins verifies et enrichis.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Liste des magasins</CardTitle>
              <CardDescription>
                Magasins halal certifies et enrichis via Google Places.
              </CardDescription>
            </div>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Rechercher par nom ou adresse..." className="pl-8" />
            </div>
          </div>

          {/* Type filter badges */}
          <div className="flex flex-wrap gap-2 pt-2">
            {typeFilters.map((filter) => (
              <Badge
                key={filter.label}
                variant={filter.active ? "default" : "outline"}
                className="cursor-pointer"
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
                <TableHead>Certifieur</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="text-right">Google Place</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores.map((store) => (
                <TableRow key={store.name}>
                  <TableCell className="font-medium">{store.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="size-3 shrink-0" />
                      <span className="max-w-[250px] truncate">
                        {store.address}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getTypeVariant(store.type)}>
                      {store.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {store.certifier}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="size-3 fill-primary text-primary" />
                      <span className="font-medium">{store.rating}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-mono text-xs text-muted-foreground">
                      {store.googlePlaceId}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination placeholder */}
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">
              Affichage de 1 a 5 sur 383 magasins
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon-sm" disabled>
                <ChevronLeft className="size-4" />
                <span className="sr-only">Page precedente</span>
              </Button>
              <span className="text-sm font-medium">Page 1 / 77</span>
              <Button variant="outline" size="icon-sm">
                <ChevronRight className="size-4" />
                <span className="sr-only">Page suivante</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
