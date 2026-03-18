import {
  AlertTriangle,
  ShieldAlert,
  AlertOctagon,
  Info,
  Clock,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const typeFilters = [
  { label: "Toutes", active: true },
  { label: "Boycott", active: false },
  { label: "Rappel", active: false },
  { label: "Fraude", active: false },
]

const alerts = [
  {
    title: "Rappel produit : E471 d'origine animale detecte dans lot Brossard",
    description:
      "Le lot L2026-0315 des Brownie Brossard contient du E471 d'origine porcine non declare. Tous les utilisateurs ayant scanne ce produit ont ete notifies.",
    type: "recall" as const,
    severity: "critical" as const,
    date: "18 mars 2026",
    affectedProducts: 1,
    affectedUsers: 342,
  },
  {
    title: "Boycott : ajout de 3 nouvelles marques a la liste",
    description:
      "Suite aux decisions de la communaute, les marques XYZ Food, Alpha Snacks et Beta Drinks sont ajoutees au registre de boycott. Raison : financement documente.",
    type: "boycott" as const,
    severity: "warning" as const,
    date: "17 mars 2026",
    affectedProducts: 47,
    affectedUsers: 0,
  },
  {
    title: "Fraude potentielle : faux certificat halal sur produit importe",
    description:
      "Un certificat halal frauduleux a ete detecte sur un lot de viande importee du Bresil. Le produit est reference sous le code 789123456789. Enquete en cours.",
    type: "fraud" as const,
    severity: "critical" as const,
    date: "15 mars 2026",
    affectedProducts: 3,
    affectedUsers: 89,
  },
  {
    title: "Mise a jour : changement de statut AVS pour 12 produits",
    description:
      "Le certificateur AVS a mis a jour ses listes. 12 produits passent de 'certifie' a 'en revision'. Les verdicts seront temporairement marques comme douteux.",
    type: "recall" as const,
    severity: "info" as const,
    date: "14 mars 2026",
    affectedProducts: 12,
    affectedUsers: 1204,
  },
]

function getSeverityIcon(severity: "critical" | "warning" | "info") {
  switch (severity) {
    case "critical":
      return <AlertOctagon className="size-5 text-destructive" />
    case "warning":
      return <AlertTriangle className="size-5 text-warning" />
    case "info":
      return <Info className="size-5 text-primary" />
  }
}

function getSeverityBadge(severity: "critical" | "warning" | "info") {
  switch (severity) {
    case "critical":
      return <Badge variant="destructive">Critique</Badge>
    case "warning":
      return (
        <Badge className="bg-warning/10 text-warning-foreground border-warning/20">
          Avertissement
        </Badge>
      )
    case "info":
      return <Badge variant="secondary">Information</Badge>
  }
}

function getTypeBadge(type: "recall" | "boycott" | "fraud") {
  switch (type) {
    case "recall":
      return <Badge variant="outline">Rappel</Badge>
    case "boycott":
      return <Badge variant="outline">Boycott</Badge>
    case "fraud":
      return <Badge variant="outline">Fraude</Badge>
  }
}

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Alertes</h1>
        <p className="text-muted-foreground">
          Suivi des alertes de securite alimentaire et boycotts.
        </p>
      </div>

      {/* Filter badges */}
      <div className="flex flex-wrap gap-2">
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

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-destructive/10">
              <ShieldAlert className="size-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">2</p>
              <p className="text-xs text-muted-foreground">Alertes critiques</p>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-warning/10">
              <AlertTriangle className="size-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">1</p>
              <p className="text-xs text-muted-foreground">Avertissements</p>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <Info className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">1</p>
              <p className="text-xs text-muted-foreground">Informations</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts list */}
      <div className="space-y-4">
        {alerts.map((alert) => (
          <Card key={alert.title}>
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {getSeverityIcon(alert.severity)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {getSeverityBadge(alert.severity)}
                    {getTypeBadge(alert.type)}
                  </div>
                  <CardTitle className="text-base">{alert.title}</CardTitle>
                  <CardDescription>{alert.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="size-3" />
                  {alert.date}
                </div>
                <span>
                  {alert.affectedProducts} produit
                  {alert.affectedProducts > 1 ? "s" : ""} concerne
                  {alert.affectedProducts > 1 ? "s" : ""}
                </span>
                {alert.affectedUsers > 0 && (
                  <span>
                    {alert.affectedUsers.toLocaleString("fr-FR")} utilisateur
                    {alert.affectedUsers > 1 ? "s" : ""} notifie
                    {alert.affectedUsers > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
