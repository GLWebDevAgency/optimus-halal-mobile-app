"use client"

import { useState } from "react"
import { Plus, Clock, CalendarBlank } from "@phosphor-icons/react"

import { trpc } from "@/lib/trpc"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

const TYPE_FILTERS = [
  { label: "Tous", value: undefined },
  { label: "Blog", value: "blog" },
  { label: "Partenaires", value: "partner_news" },
  { label: "Éducatif", value: "educational" },
  { label: "Communauté", value: "community" },
] as const

function getTypeBadge(type: string) {
  switch (type) {
    case "blog":
      return <Badge variant="outline">Blog</Badge>
    case "partner_news":
      return <Badge variant="destructive">Partenaires</Badge>
    case "educational":
      return <Badge variant="secondary">Éducatif</Badge>
    case "community":
      return <Badge variant="outline">Communauté</Badge>
    default:
      return <Badge variant="outline">{type}</Badge>
  }
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function SkeletonCard() {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-14" />
        </div>
        <Skeleton className="mt-2 h-5 w-3/4" />
        <Skeleton className="mt-1 h-4 w-full" />
        <Skeleton className="mt-1 h-4 w-2/3" />
      </CardHeader>
      <CardFooter className="mt-auto">
        <div className="flex w-full items-center justify-between">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </CardFooter>
    </Card>
  )
}

export default function ArticlesPage() {
  const [type, setType] = useState<"blog" | "partner_news" | "educational" | "community" | undefined>(undefined)

  const { data, isLoading } = trpc.article.list.useQuery({
    type,
    limit: 20,
  })

  const articles = data?.items ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Articles</h1>
          <p className="text-muted-foreground">
            Gestion du contenu éditorial Naqiy.
          </p>
        </div>
        <Button>
          <Plus className="size-4" />
          Nouvel article
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {TYPE_FILTERS.map((filter) => (
          <Badge
            key={filter.label}
            variant={type === filter.value ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setType(filter.value)}
          >
            {filter.label}
          </Badge>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed">
          <p className="text-muted-foreground">Aucun article trouvé</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {articles.map((article) => (
            <Card key={article.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {getTypeBadge(article.type)}
                    {article.isPublished ? (
                      <Badge variant="default">Publié</Badge>
                    ) : (
                      <Badge variant="secondary">Brouillon</Badge>
                    )}
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
                    {article.publishedAt
                      ? formatDate(article.publishedAt)
                      : formatDate(article.createdAt)}
                  </div>
                  {article.readTimeMinutes != null && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      {article.readTimeMinutes} min de lecture
                    </div>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
