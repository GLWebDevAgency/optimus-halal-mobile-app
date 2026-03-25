"use client"

import { useState } from "react"
import { MagnifyingGlass, Plus } from "@phosphor-icons/react"
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
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { FlagDetailSheet } from "@/components/admin/flag-detail-sheet"
import { CreateFlagDialog } from "@/components/admin/create-flag-dialog"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const enabledFilters = [
  { label: "Tous", value: undefined },
  { label: "Actifs", value: true },
  { label: "Inactifs", value: false },
] as const

function getTypeBadge(flagType: string) {
  switch (flagType) {
    case "boolean":
      return <Badge variant="outline">Boolean</Badge>
    case "percentage":
      return <Badge variant="secondary">Rollout %</Badge>
    case "variant":
      return <Badge variant="default">A/B</Badge>
    default:
      return <Badge variant="outline">{flagType}</Badge>
  }
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function FlagsPage() {
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search, 400)
  const [enabledFilter, setEnabledFilter] = useState<boolean | undefined>(undefined)
  const [selectedFlagId, setSelectedFlagId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const utils = trpc.useUtils()

  const { data, isLoading } = trpc.featureFlags.list.useQuery(
    {
      search: debouncedSearch || undefined,
      enabled: enabledFilter,
    },
    { staleTime: 10_000 }
  )

  const toggleMutation = trpc.featureFlags.toggle.useMutation({
    onSuccess: () => {
      utils.featureFlags.list.invalidate()
    },
  })

  const flags = data?.items ?? []
  const total = data?.total ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Feature Flags</h1>
        <p className="text-muted-foreground">
          Gestion des {total} feature flags — rollout progressif, ciblage, A/B tests.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Flags</CardTitle>
              <CardDescription>
                Activez, désactivez et configurez les fonctionnalités.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-full max-w-xs">
                <MagnifyingGlass className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un flag..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button size="sm" onClick={() => setShowCreate(true)}>
                <Plus className="mr-1 size-4" />
                Créer
              </Button>
            </div>
          </div>

          {/* Filter badges */}
          <div className="flex flex-wrap gap-2 pt-2">
            {enabledFilters.map((filter) => (
              <Badge
                key={filter.label}
                variant={enabledFilter === filter.value ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setEnabledFilter(filter.value)}
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
                <TableHead>Label</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Rollout</TableHead>
                <TableHead>Rules</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Dernière MAJ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-10" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="ml-auto h-4 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : flags.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Aucun flag trouvé.
                  </TableCell>
                </TableRow>
              ) : (
                flags.map((flag) => {
                  const rulesCount = Array.isArray(flag.rules) ? (flag.rules as unknown[]).length : 0
                  return (
                    <TableRow
                      key={flag.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedFlagId(flag.id)}
                    >
                      <TableCell className="font-medium">{flag.label}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {flag.key}
                      </TableCell>
                      <TableCell>{getTypeBadge(flag.flagType)}</TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">
                          {flag.rolloutPercentage}%
                        </span>
                      </TableCell>
                      <TableCell>
                        {rulesCount > 0 ? (
                          <Badge variant="secondary">{rulesCount}</Badge>
                        ) : (
                          <span className="text-muted-foreground">&mdash;</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch
                          size="sm"
                          checked={flag.enabled}
                          onCheckedChange={(checked) => {
                            toggleMutation.mutate({ id: flag.id, enabled: !!checked })
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatDate(flag.updatedAt)}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail sheet */}
      <FlagDetailSheet
        flagId={selectedFlagId}
        onClose={() => setSelectedFlagId(null)}
      />

      {/* Create dialog */}
      <CreateFlagDialog
        open={showCreate}
        onOpenChange={setShowCreate}
      />
    </div>
  )
}
