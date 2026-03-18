import { Search, ChevronLeft, ChevronRight } from "lucide-react"

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

const tierFilters = [
  { label: "Tous", active: true },
  { label: "Free", active: false },
  { label: "Naqiy+", active: false },
]

const users = [
  {
    email: "mehdi.benali@gmail.com",
    name: "Mehdi Benali",
    tier: "Naqiy+",
    madhab: "Hanafi",
    scans: 847,
    createdAt: "12/01/2026",
  },
  {
    email: "sarah.dupont@outlook.fr",
    name: "Sarah Dupont",
    tier: "Free",
    madhab: "Maliki",
    scans: 234,
    createdAt: "28/01/2026",
  },
  {
    email: "karim.hassan@yahoo.fr",
    name: "Karim Hassan",
    tier: "Naqiy+",
    madhab: "Shafi'i",
    scans: 1203,
    createdAt: "05/12/2025",
  },
  {
    email: "fatima.amrani@gmail.com",
    name: "Fatima Amrani",
    tier: "Free",
    madhab: "Hanbali",
    scans: 56,
    createdAt: "10/03/2026",
  },
  {
    email: "youssef.koura@proton.me",
    name: "Youssef Koura",
    tier: "Free",
    madhab: "Hanafi",
    scans: 412,
    createdAt: "22/02/2026",
  },
]

function getTierVariant(tier: string) {
  return tier === "Naqiy+" ? ("default" as const) : ("secondary" as const)
}

export default function UsersPage() {
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
                12 847 utilisateurs inscrits au total.
              </CardDescription>
            </div>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Rechercher par email ou nom..." className="pl-8" />
            </div>
          </div>

          {/* Tier filter badges */}
          <div className="flex flex-wrap gap-2 pt-2">
            {tierFilters.map((filter) => (
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
                <TableHead>Email</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Madhab</TableHead>
                <TableHead>Scans</TableHead>
                <TableHead className="text-right">Inscrit le</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.email}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>
                    <Badge variant={getTierVariant(user.tier)}>
                      {user.tier}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.madhab}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {user.scans.toLocaleString("fr-FR")}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {user.createdAt}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination placeholder */}
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">
              Affichage de 1 a 5 sur 12 847 utilisateurs
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon-sm" disabled>
                <ChevronLeft className="size-4" />
                <span className="sr-only">Page precedente</span>
              </Button>
              <span className="text-sm font-medium">Page 1 / 2 570</span>
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
