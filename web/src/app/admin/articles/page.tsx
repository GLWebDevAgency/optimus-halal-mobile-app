"use client"

import { Plus, Clock, CalendarBlank } from "@phosphor-icons/react"

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const articles = [
  {
    title: "Les additifs alimentaires : guide complet pour le consommateur musulman",
    category: "Guide",
    status: "published" as const,
    date: "15 mars 2026",
    excerpt:
      "Comprendre les E-numbers et leur statut halal selon les 4 ecoles juridiques. Un guide exhaustif pour ne plus douter devant une etiquette.",
  },
  {
    title: "Boycott alimentaire 2026 : quelles marques et pourquoi ?",
    category: "Actualite",
    status: "published" as const,
    date: "12 mars 2026",
    excerpt:
      "Liste mise a jour des marques concernees par le boycott, avec les raisons et les alternatives halal disponibles en France.",
  },
  {
    title: "Ramadan 2026 : preparer son alimentation",
    category: "Saisonnier",
    status: "draft" as const,
    date: "10 mars 2026",
    excerpt:
      "Conseils nutritionnels et selection de produits halal verifies pour un Ramadan en pleine forme. Suhoor et Iftar optimises.",
  },
  {
    title: "Comment Naqiy analyse vos produits : transparence sur notre IA",
    category: "Technologie",
    status: "draft" as const,
    date: "8 mars 2026",
    excerpt:
      "Decouverte du fonctionnement de notre intelligence artificielle : extraction d'ingredients, analyse des additifs et verdict personnalise.",
  },
]

function getStatusBadge(status: "published" | "draft") {
  if (status === "published") {
    return (
      <Badge variant="default">
        Publie
      </Badge>
    )
  }
  return (
    <Badge variant="secondary">
      Brouillon
    </Badge>
  )
}

function getCategoryVariant(category: string) {
  switch (category) {
    case "Guide":
      return "outline" as const
    case "Actualite":
      return "destructive" as const
    case "Saisonnier":
      return "secondary" as const
    case "Technologie":
      return "outline" as const
    default:
      return "outline" as const
  }
}

export default function ArticlesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Articles</h1>
          <p className="text-muted-foreground">
            Gestion du contenu editorial Naqiy.
          </p>
        </div>
        <Button>
          <Plus className="size-4" />
          Nouvel article
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {articles.map((article) => (
          <Card key={article.title} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={getCategoryVariant(article.category)}>
                    {article.category}
                  </Badge>
                  {getStatusBadge(article.status)}
                </div>
              </div>
              <CardTitle className="line-clamp-2 text-base">
                {article.title}
              </CardTitle>
              <CardDescription className="line-clamp-3">
                {article.excerpt}
              </CardDescription>
            </CardHeader>

            <CardFooter className="mt-auto">
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarBlank className="size-3" />
                  {article.date}
                </div>
                {article.status === "draft" && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    En attente
                  </div>
                )}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
