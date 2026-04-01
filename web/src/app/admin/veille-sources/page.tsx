"use client"

import { useState, useCallback } from "react"
import {
  GlobeSimple,
  Plus,
  PencilSimple,
  Trash,
  Eye,
  EyeSlash,
  ArrowsClockwise,
  RssSimple,
  InstagramLogo,
  TiktokLogo,
  YoutubeLogo,
  Globe,
  Clock,
  CheckCircle,
} from "@phosphor-icons/react"

import { trpc } from "@/lib/trpc"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

// ── Constants ──

const SOURCE_TYPES = [
  { value: "rss", label: "RSS", icon: RssSimple },
  { value: "website", label: "Site web", icon: Globe },
  { value: "instagram", label: "Instagram", icon: InstagramLogo },
  { value: "tiktok", label: "TikTok", icon: TiktokLogo },
  { value: "youtube", label: "YouTube", icon: YoutubeLogo },
] as const

const TARGET_TYPES = [
  { value: "auto", label: "Auto (IA decide)" },
  { value: "alert", label: "Alerte" },
  { value: "article", label: "Article" },
] as const

const CATEGORY_HINTS = [
  { value: null, label: "Aucune (IA decide)" },
  { value: "fraud", label: "Fraude Halal" },
  { value: "boycott", label: "Boycott" },
  { value: "certification", label: "Certification" },
  { value: "community", label: "Communaute" },
] as const

type SourceType = (typeof SOURCE_TYPES)[number]["value"]

function getSourceIcon(type: string) {
  const found = SOURCE_TYPES.find((t) => t.value === type)
  const Icon = found?.icon ?? GlobeSimple
  return <Icon className="size-4" />
}

function formatDate(date: Date | string | null) {
  if (!date) return "Jamais"
  return new Date(date).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// ── Form ──

interface SourceFormData {
  name: string
  url: string
  type: SourceType
  targetType: "alert" | "article" | "auto"
  categoryHint: string | null
}

const DEFAULT_FORM: SourceFormData = {
  name: "",
  url: "",
  type: "rss",
  targetType: "auto",
  categoryHint: null,
}

// ── Page ──

export default function SourcesPage() {
  const utils = trpc.useUtils()

  const { data, isLoading } = trpc.contentSource.list.useQuery()
  const items = data?.items ?? []
  const stats = data?.stats ?? { total: 0, active: 0, inactive: 0 }

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<SourceFormData>(DEFAULT_FORM)
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null)

  const createMutation = trpc.contentSource.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Source "${data.name}" creee`)
      setSheetOpen(false)
      setForm(DEFAULT_FORM)
      utils.contentSource.list.invalidate()
    },
    onError: (err) => toast.error(err.message),
  })

  const updateMutation = trpc.contentSource.update.useMutation({
    onSuccess: (data) => {
      toast.success(`Source "${data.name}" mise a jour`)
      setSheetOpen(false)
      setForm(DEFAULT_FORM)
      setEditingId(null)
      utils.contentSource.list.invalidate()
    },
    onError: (err) => toast.error(err.message),
  })

  const toggleMutation = trpc.contentSource.toggleActive.useMutation({
    onSuccess: (data) => {
      toast.success(data.isActive ? "Source activee" : "Source desactivee")
      utils.contentSource.list.invalidate()
    },
  })

  const deleteMutation = trpc.contentSource.delete.useMutation({
    onSuccess: () => {
      toast.success("Source supprimee")
      setDeleteDialogId(null)
      utils.contentSource.list.invalidate()
    },
    onError: (err) => toast.error(err.message),
  })

  const resetMutation = trpc.contentSource.resetFetch.useMutation({
    onSuccess: (data) => {
      toast.success(`Historique de "${data.name}" reinitialise`)
      utils.contentSource.list.invalidate()
    },
  })

  const handleNew = useCallback(() => {
    setEditingId(null)
    setForm(DEFAULT_FORM)
    setSheetOpen(true)
  }, [])

  const handleEdit = useCallback((source: typeof items[0]) => {
    setEditingId(source.id)
    setForm({
      name: source.name,
      url: source.url,
      type: source.type as SourceType,
      targetType: source.targetType as SourceFormData["targetType"],
      categoryHint: source.categoryHint,
    })
    setSheetOpen(true)
  }, [])

  const handleSave = useCallback(() => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...form })
    } else {
      createMutation.mutate(form)
    }
  }, [form, editingId, createMutation, updateMutation])

  const updateField = useCallback(
    <K extends keyof SourceFormData>(key: K, value: SourceFormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sources Veille</h1>
          <p className="text-muted-foreground">
            Sources surveillees par la veille automatique Claude Cowork.
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="size-4" />
          Nouvelle source
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <GlobeSimple className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{isLoading ? "-" : stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <CheckCircle className="size-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{isLoading ? "-" : stats.active}</p>
              <p className="text-xs text-muted-foreground">Actives</p>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <EyeSlash className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{isLoading ? "-" : stats.inactive}</p>
              <p className="text-xs text-muted-foreground">Inactives</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sources list */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-4 py-4">
                <Skeleton className="size-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-64" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
              <GlobeSimple className="size-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Aucune source configuree.</p>
              <Button size="sm" variant="outline" onClick={handleNew}>
                <Plus className="size-4" />
                Ajouter une source
              </Button>
            </CardContent>
          </Card>
        ) : (
          items.map((source) => (
            <Card key={source.id} className={!source.isActive ? "opacity-50" : ""}>
              <CardContent className="flex items-center gap-4 py-4">
                {/* Icon */}
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  {getSourceIcon(source.type)}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{source.name}</p>
                    <Badge variant="outline" className="text-[10px]">
                      {SOURCE_TYPES.find((t) => t.value === source.type)?.label ?? source.type}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {TARGET_TYPES.find((t) => t.value === source.targetType)?.label ?? source.targetType}
                    </Badge>
                    {source.categoryHint && (
                      <Badge variant="outline" className="text-[10px]">
                        {source.categoryHint}
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{source.url}</p>
                  <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      Dernier fetch : {formatDate(source.lastFetchedAt)}
                    </span>
                    {source.lastFetchCount != null && source.lastFetchCount > 0 && (
                      <span>{source.lastFetchCount} elements</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Reinitialiser l'historique"
                    onClick={() => resetMutation.mutate({ id: source.id })}
                    disabled={resetMutation.isPending}
                  >
                    <ArrowsClockwise className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    title={source.isActive ? "Desactiver" : "Activer"}
                    onClick={() => toggleMutation.mutate({ id: source.id })}
                  >
                    {source.isActive ? <EyeSlash className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(source)}>
                    <PencilSimple className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setDeleteDialogId(source.id)}
                  >
                    <Trash className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editingId ? "Modifier la source" : "Nouvelle source"}</SheetTitle>
            <SheetDescription>
              {editingId
                ? "Modifiez les informations de la source."
                : "Ajoutez une source a surveiller par la veille automatique."}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="source-name">Nom</Label>
              <Input
                id="source-name"
                placeholder="Ex: Al-Kanz, AVS Actualites..."
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="source-url">URL</Label>
              <Input
                id="source-url"
                placeholder="https://www.al-kanz.org/feed/"
                value={form.url}
                onChange={(e) => updateField("url", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Type de source</Label>
              <div className="flex flex-wrap gap-2">
                {SOURCE_TYPES.map((t) => {
                  const Icon = t.icon
                  return (
                    <Badge
                      key={t.value}
                      variant={form.type === t.value ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => updateField("type", t.value)}
                    >
                      <Icon className="mr-1 size-3" />
                      {t.label}
                    </Badge>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cible du contenu</Label>
              <div className="flex flex-wrap gap-2">
                {TARGET_TYPES.map((t) => (
                  <Badge
                    key={t.value}
                    variant={form.targetType === t.value ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => updateField("targetType", t.value as SourceFormData["targetType"])}
                  >
                    {t.label}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                &laquo;Auto&raquo; laisse Claude decider si le contenu doit devenir une alerte ou un article.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Categorie suggeree (optionnel)</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_HINTS.map((c) => (
                  <Badge
                    key={c.value ?? "none"}
                    variant={form.categoryHint === c.value ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => updateField("categoryHint", c.value)}
                  >
                    {c.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                className="flex-1"
                onClick={handleSave}
                disabled={isPending || !form.name || !form.url}
              >
                {editingId ? "Mettre a jour" : "Ajouter la source"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSheetOpen(false)
                  setForm(DEFAULT_FORM)
                  setEditingId(null)
                }}
              >
                Annuler
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete dialog */}
      <Dialog open={deleteDialogId !== null} onOpenChange={(open) => !open && setDeleteDialogId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer cette source ?</DialogTitle>
            <DialogDescription>
              La source sera supprimee. Les drafts deja crees ne seront pas affectes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogId(null)}>Annuler</Button>
            <Button
              variant="destructive"
              onClick={() => deleteDialogId && deleteMutation.mutate({ id: deleteDialogId })}
              disabled={deleteMutation.isPending}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
