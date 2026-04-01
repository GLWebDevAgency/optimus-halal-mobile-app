"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  FloppyDisk,
  PaperPlaneTilt,
  Trash,
} from "@phosphor-icons/react"

import { trpc } from "@/lib/trpc"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"

// ── Types ──

const ARTICLE_TYPES = [
  { value: "blog", label: "Blog" },
  { value: "partner_news", label: "Partenaires" },
  { value: "educational", label: "Educatif" },
  { value: "community", label: "Communaute" },
] as const

type ArticleType = (typeof ARTICLE_TYPES)[number]["value"]

interface ArticleFormData {
  title: string
  slug: string
  excerpt: string
  content: string
  coverImage: string
  author: string
  type: ArticleType
  tags: string[]
  readTimeMinutes: number
  externalLink: string
  isPublished: boolean
}

interface ArticleFormProps {
  /** Existing article data for edit mode */
  initialData?: ArticleFormData & { id: string }
  mode: "create" | "edit"
}

// ── Helpers ──

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200)
}

function estimateReadTime(content: string): number {
  const words = content.trim().split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
}

// ── Component ──

export function ArticleForm({ initialData, mode }: ArticleFormProps) {
  const router = useRouter()
  const utils = trpc.useUtils()

  const [form, setForm] = useState<ArticleFormData>({
    title: initialData?.title ?? "",
    slug: initialData?.slug ?? "",
    excerpt: initialData?.excerpt ?? "",
    content: initialData?.content ?? "",
    coverImage: initialData?.coverImage ?? "",
    author: initialData?.author ?? "Naqiy Team",
    type: initialData?.type ?? "blog",
    tags: initialData?.tags ?? [],
    readTimeMinutes: initialData?.readTimeMinutes ?? 3,
    externalLink: initialData?.externalLink ?? "",
    isPublished: initialData?.isPublished ?? false,
  })

  const [tagInput, setTagInput] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const createMutation = trpc.article.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Article "${data.title}" cree`)
      utils.article.adminList.invalidate()
      router.push("/admin/articles")
    },
    onError: (err) => toast.error(err.message),
  })

  const updateMutation = trpc.article.update.useMutation({
    onSuccess: (data) => {
      toast.success(`Article "${data.title}" mis a jour`)
      utils.article.adminList.invalidate()
    },
    onError: (err) => toast.error(err.message),
  })

  const deleteMutation = trpc.article.delete.useMutation({
    onSuccess: () => {
      toast.success("Article supprime")
      utils.article.adminList.invalidate()
      router.push("/admin/articles")
    },
    onError: (err) => toast.error(err.message),
  })

  const togglePublishMutation = trpc.article.togglePublish.useMutation({
    onSuccess: (data) => {
      setForm((prev) => ({ ...prev, isPublished: data.isPublished }))
      toast.success(data.isPublished ? "Article publie" : "Article depublie")
      utils.article.adminList.invalidate()
    },
    onError: (err) => toast.error(err.message),
  })

  const isPending =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  const updateField = useCallback(
    <K extends keyof ArticleFormData>(key: K, value: ArticleFormData[K]) => {
      setForm((prev) => {
        const next = { ...prev, [key]: value }
        // Auto-generate slug from title
        if (key === "title" && mode === "create" && !prev.slug) {
          next.slug = generateSlug(value as string)
        }
        // Auto-estimate read time from content
        if (key === "content") {
          next.readTimeMinutes = estimateReadTime(value as string)
        }
        return next
      })
    },
    [mode],
  )

  const handleAddTag = useCallback(() => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !form.tags.includes(tag) && form.tags.length < 10) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, tag] }))
      setTagInput("")
    }
  }, [tagInput, form.tags])

  const handleRemoveTag = useCallback((tag: string) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }))
  }, [])

  const handleSave = useCallback(
    (publish?: boolean) => {
      const data = {
        ...form,
        coverImage: form.coverImage || null,
        externalLink: form.externalLink || null,
        isPublished: publish ?? form.isPublished,
      }

      if (mode === "create") {
        createMutation.mutate(data)
      } else if (initialData) {
        updateMutation.mutate({ id: initialData.id, ...data })
      }
    },
    [form, mode, initialData, createMutation, updateMutation],
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/articles")}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {mode === "create" ? "Nouvel article" : "Modifier l'article"}
            </h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {form.isPublished ? (
                <Badge variant="default" className="text-[10px]">Publie</Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px]">Brouillon</Badge>
              )}
              {form.readTimeMinutes > 0 && (
                <span>{form.readTimeMinutes} min de lecture</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {mode === "edit" && initialData && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => togglePublishMutation.mutate({ id: initialData.id })}
                disabled={togglePublishMutation.isPending}
              >
                {form.isPublished ? "Depublier" : "Publier"}
              </Button>
              <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive">
                    <Trash className="size-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Supprimer l&apos;article ?</DialogTitle>
                    <DialogDescription>
                      Cette action est irreversible. L&apos;article sera definitivement supprime.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                      Annuler
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => deleteMutation.mutate({ id: initialData.id })}
                      disabled={deleteMutation.isPending}
                    >
                      Supprimer
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={isPending}
          >
            <FloppyDisk className="mr-1.5 size-4" />
            {mode === "create" ? "Brouillon" : "Enregistrer"}
          </Button>
          <Button
            size="sm"
            onClick={() => handleSave(true)}
            disabled={isPending}
          >
            <PaperPlaneTilt className="mr-1.5 size-4" />
            Publier
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content (2/3) */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  placeholder="Titre de l'article..."
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  className="text-lg font-semibold"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL)</Label>
                <Input
                  id="slug"
                  placeholder="mon-article-halal"
                  value={form.slug}
                  onChange={(e) => updateField("slug", e.target.value)}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Extrait</Label>
                <Textarea
                  id="excerpt"
                  placeholder="Resume court de l'article (affiché dans les listes)..."
                  value={form.excerpt}
                  onChange={(e) => updateField("excerpt", e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Contenu (Markdown)</Label>
                <Textarea
                  id="content"
                  placeholder="# Mon article&#10;&#10;Ecrivez votre article en Markdown..."
                  value={form.content}
                  onChange={(e) => updateField("content", e.target.value)}
                  rows={16}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Markdown supporte : # titres, **gras**, *italique*, [liens](url), listes
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar (1/3) */}
        <div className="space-y-4">
          {/* Type */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {ARTICLE_TYPES.map((t) => (
                  <Badge
                    key={t.value}
                    variant={form.type === t.value ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => updateField("type", t.value)}
                  >
                    {t.label}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Media */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="coverImage">Image de couverture (URL)</Label>
                <Input
                  id="coverImage"
                  placeholder="https://..."
                  value={form.coverImage}
                  onChange={(e) => updateField("coverImage", e.target.value)}
                  className="text-sm"
                />
                {form.coverImage && (
                  <img
                    src={form.coverImage}
                    alt="Preview"
                    className="h-32 w-full rounded-lg object-cover"
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="externalLink">Lien externe</Label>
                <Input
                  id="externalLink"
                  placeholder="https://al-kanz.org/..."
                  value={form.externalLink}
                  onChange={(e) => updateField("externalLink", e.target.value)}
                  className="text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="author">Auteur</Label>
                <Input
                  id="author"
                  value={form.author}
                  onChange={(e) => updateField("author", e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ajouter un tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                    className="text-sm"
                  />
                  <Button variant="outline" size="sm" onClick={handleAddTag} type="button">
                    +
                  </Button>
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {form.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer text-xs"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        {tag} &times;
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="readTime">Temps de lecture (min)</Label>
                <Input
                  id="readTime"
                  type="number"
                  min={1}
                  max={60}
                  value={form.readTimeMinutes}
                  onChange={(e) => updateField("readTimeMinutes", parseInt(e.target.value) || 1)}
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Auto-calcule depuis le contenu
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
