"use client"

import { useParams } from "next/navigation"
import { trpc } from "@/lib/trpc"
import { ArticleForm } from "@/components/admin/article-form"
import { Skeleton } from "@/components/ui/skeleton"

export default function EditArticlePage() {
  const { id } = useParams<{ id: string }>()

  const { data: article, isLoading } = trpc.article.getById.useQuery(
    { id: id! },
    { enabled: !!id },
  )

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!article) {
    return <p className="text-muted-foreground">Article introuvable.</p>
  }

  return (
    <ArticleForm
      mode="edit"
      initialData={{
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt ?? "",
        content: article.content ?? "",
        coverImage: article.coverImage ?? "",
        author: article.author,
        type: article.type as "blog" | "partner_news" | "educational" | "community",
        tags: (article.tags ?? []) as string[],
        readTimeMinutes: article.readTimeMinutes ?? 3,
        externalLink: article.externalLink ?? "",
        isPublished: article.isPublished,
      }}
    />
  )
}
