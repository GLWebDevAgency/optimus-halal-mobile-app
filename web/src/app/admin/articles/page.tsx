"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Plus,
  Clock,
  CalendarBlank,
  PencilSimple,
  Eye,
  EyeSlash,
  FileText,
  Notebook,
} from "@phosphor-icons/react"

import { trpc } from "@/lib/trpc"
import {
  Card,
  CardContent,
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
  { label: "Educatif", value: "educational" },
  { label: "Communaute", value: "community" },
] as const

const STATUS_FILTERS = [
  { label: "Tous", value: undefined },
  { label: "Publies", value: true },
  { label: "Brouillons", value: false },
] as const

function getTypeBadge(type: string) {
  switch (type) {
    case "blog":
      return <Badge variant="outline">Blog</Badge>
    case "partner_news":
      return <Badge variant="destructive">Partenaires</Badge>
    case "educational":
      return <Badge variant="secondary">Educatif</Badge>
    case "community":
      return <Badge variant="outline">Communaute</Badge>
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
      </CardHeader>
      <CardFooter className="mt-auto">
        <Skeleton className="h-3 w-28" />
      </CardFooter>
    </Card>
  )
}

export default function ArticlesPage() {
  const [type, setType] = useState<
    "blog" | "partner_news" | "educational" | "community" | undefined
  >(undefined)
  const [isPublished, setIsPublished] = useState<boolean | undefined>(undefined)

  const { data, isLoading } = trpc.article.adminList.useQuery({
    type,
    isPublished,
    limit: 50,
  })

  const articles = data?.items ?? []
  const stats = data?.stats ?? { total: 0, published: 0, drafts: 0 }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Articles</h1>
          <p className="text-muted-foreground">
            Gestion du contenu editorial Naqiy.
          </p>
        </div>
        <Link href="/admin/articles/new">
          <Button>
            <Plus className="size-4" />
            Nouvel article
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <Eye className="size-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.published}</p>
              <p className="text-xs text-muted-foreground">Publies</p>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Notebook className="size-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.drafts}</p>
              <p className="text-xs text-muted-foreground">Brouillons</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap gap-2">
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
        <div className="h-5 w-px bg-border" />
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => (
            <Badge
              key={filter.label}
              variant={isPublished === filter.value ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setIsPublished(filter.value)}
            >
              {filter.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Articles grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed">
          <FileText className="size-10 text-muted-foreground/30" />
          <p className="text-muted-foreground">Aucun article trouve</p>
          <Link href="/admin/articles/new">
            <Button size="sm" variant="outline">
              <Plus className="size-4" />
              Creer un article
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/admin/articles/${article.id}/edit`}
              className="group"
            >
              <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
                {/* Cover image preview */}
                {article.coverImage && (
                  <div className="relative h-32 overflow-hidden rounded-t-xl">
                    <img
                      src={article.coverImage}
                      alt=""
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                  </div>
                )}
                <CardHeader className={article.coverImage ? "pt-3" : ""}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {getTypeBadge(article.type)}
                      {article.isPublished ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                          <Eye className="mr-0.5 size-3" />
                          Publie
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          <EyeSlash className="mr-0.5 size-3" />
                          Brouillon
                        </Badge>
                      )}
                    </div>
                    <PencilSimple className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <CardTitle className="line-clamp-2 text-base">
                    {article.title}
                  </CardTitle>
                  {article.excerpt && (
                    <CardDescription className="line-clamp-2">
                      {article.excerpt}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardFooter className="mt-auto">
                  <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <CalendarBlank className="size-3" />
                      {formatDate(article.updatedAt)}
                    </div>
                    <div className="flex items-center gap-3">
                      {article.author !== "Naqiy Team" && (
                        <span>{article.author}</span>
                      )}
                      {article.readTimeMinutes != null && (
                        <div className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {article.readTimeMinutes} min
                        </div>
                      )}
                    </div>
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
