"use client"

import { useState, useCallback } from "react"
import {
  Warning,
  WarningOctagon,
  Info,
  Clock,
  Plus,
  PencilSimple,
  Trash,
  Eye,
  EyeSlash,
  CheckCircle,
} from "@phosphor-icons/react"

import { trpc } from "@/lib/trpc"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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

type Severity = "critical" | "warning" | "info"

const SEVERITY_CONFIG: Record<Severity, { icon: typeof WarningOctagon; color: string; label: string }> = {
  critical: { icon: WarningOctagon, color: "text-destructive", label: "Critique" },
  warning: { icon: Warning, color: "text-amber-500", label: "Avertissement" },
  info: { icon: Info, color: "text-primary", label: "Information" },
}

const CATEGORIES = [
  { id: "fraud", label: "Fraude Halal" },
  { id: "boycott", label: "Alerte Boycott" },
  { id: "certification", label: "Mise a jour Certification" },
  { id: "community", label: "Signal Communautaire" },
]

const SEVERITY_FILTERS = [
  { label: "Toutes", value: undefined as Severity | undefined },
  { label: "Critiques", value: "critical" as Severity },
  { label: "Avertissements", value: "warning" as Severity },
  { label: "Informations", value: "info" as Severity },
]

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

// ── Alert Form (used in Sheet) ─────────────────────────

interface AlertFormData {
  title: string
  summary: string
  content: string
  severity: Severity
  priority: "low" | "medium" | "high" | "critical"
  categoryId: string
  imageUrl: string
  sourceUrl: string
}

const DEFAULT_FORM: AlertFormData = {
  title: "",
  summary: "",
  content: "",
  severity: "info",
  priority: "medium",
  categoryId: "community",
  imageUrl: "",
  sourceUrl: "",
}

export default function AlertsPage() {
  const [severity, setSeverity] = useState<Severity | undefined>(undefined)
  const utils = trpc.useUtils()

  // ── Data ──
  const { data, isLoading } = trpc.alert.adminList.useQuery({
    severity,
    limit: 50,
  })

  const items = data?.items ?? []
  const stats = data?.stats ?? { total: 0, active: 0, inactive: 0 }

  // ── Form state ──
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<AlertFormData>(DEFAULT_FORM)
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null)

  const createMutation = trpc.alert.create.useMutation({
    onSuccess: () => {
      toast.success("Alerte creee")
      setSheetOpen(false)
      setForm(DEFAULT_FORM)
      utils.alert.adminList.invalidate()
    },
    onError: (err) => toast.error(err.message),
  })

  const updateMutation = trpc.alert.update.useMutation({
    onSuccess: () => {
      toast.success("Alerte mise a jour")
      setSheetOpen(false)
      setForm(DEFAULT_FORM)
      setEditingId(null)
      utils.alert.adminList.invalidate()
    },
    onError: (err) => toast.error(err.message),
  })

  const toggleMutation = trpc.alert.toggleActive.useMutation({
    onSuccess: (data) => {
      toast.success(data.isActive ? "Alerte activee" : "Alerte desactivee")
      utils.alert.adminList.invalidate()
    },
    onError: (err) => toast.error(err.message),
  })

  const deleteMutation = trpc.alert.delete.useMutation({
    onSuccess: () => {
      toast.success("Alerte supprimee")
      setDeleteDialogId(null)
      utils.alert.adminList.invalidate()
    },
    onError: (err) => toast.error(err.message),
  })

  const handleNew = useCallback(() => {
    setEditingId(null)
    setForm(DEFAULT_FORM)
    setSheetOpen(true)
  }, [])

  const handleEdit = useCallback((alert: typeof items[0]) => {
    setEditingId(alert.id)
    setForm({
      title: alert.title,
      summary: alert.summary,
      content: alert.content,
      severity: alert.severity as Severity,
      priority: alert.priority as AlertFormData["priority"],
      categoryId: alert.categoryId ?? "community",
      imageUrl: alert.imageUrl ?? "",
      sourceUrl: alert.sourceUrl ?? "",
    })
    setSheetOpen(true)
  }, [])

  const handleSave = useCallback(() => {
    const data = {
      ...form,
      imageUrl: form.imageUrl || null,
      sourceUrl: form.sourceUrl || null,
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...data })
    } else {
      createMutation.mutate(data)
    }
  }, [form, editingId, createMutation, updateMutation])

  const updateField = useCallback(
    <K extends keyof AlertFormData>(key: K, value: AlertFormData[K]) => {
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
          <h1 className="text-2xl font-bold tracking-tight">Alertes</h1>
          <p className="text-muted-foreground">
            Veille ethique — fraude, boycott, certification, communaute.
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="size-4" />
          Nouvelle alerte
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card size="sm" key={i}>
              <CardContent className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-7 w-10" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card size="sm">
              <CardContent className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <WarningOctagon className="size-5 text-primary" />
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
                  <CheckCircle className="size-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.active}</p>
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
                  <p className="text-2xl font-bold">{stats.inactive}</p>
                  <p className="text-xs text-muted-foreground">Inactives</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {SEVERITY_FILTERS.map((filter) => (
          <Badge
            key={filter.label}
            variant={severity === filter.value ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSeverity(filter.value)}
          >
            {filter.label}
          </Badge>
        ))}
      </div>

      {/* Alerts list */}
      <div className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
              <Info className="size-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Aucune alerte trouvee.</p>
              <Button size="sm" variant="outline" onClick={handleNew}>
                <Plus className="size-4" />
                Creer une alerte
              </Button>
            </CardContent>
          </Card>
        ) : (
          items.map((alert) => {
            const sev = SEVERITY_CONFIG[(alert.severity as Severity) ?? "info"]
            const SevIcon = sev.icon

            return (
              <Card key={alert.id} className={!alert.isActive ? "opacity-50" : ""}>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <SevIcon className={`size-5 ${sev.color}`} />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={alert.severity === "critical" ? "destructive" : "outline"}
                          className="text-xs"
                        >
                          {sev.label}
                        </Badge>
                        {!alert.isActive && (
                          <Badge variant="secondary" className="text-xs">Inactive</Badge>
                        )}
                      </div>
                      <CardTitle className="text-base">{alert.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {alert.summary}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      {formatDate(alert.publishedAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleMutation.mutate({ id: alert.id })}
                        title={alert.isActive ? "Desactiver" : "Activer"}
                      >
                        {alert.isActive ? (
                          <EyeSlash className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(alert)}
                      >
                        <PencilSimple className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => setDeleteDialogId(alert.id)}
                      >
                        <Trash className="size-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* ── Create/Edit Sheet ── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>
              {editingId ? "Modifier l'alerte" : "Nouvelle alerte"}
            </SheetTitle>
            <SheetDescription>
              {editingId
                ? "Modifiez les informations et enregistrez."
                : "Remplissez les informations pour creer une alerte."}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label>Categorie</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <Badge
                    key={cat.id}
                    variant={form.categoryId === cat.id ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => updateField("categoryId", cat.id)}
                  >
                    {cat.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Severite</Label>
              <div className="flex gap-2">
                {(["info", "warning", "critical"] as const).map((s) => {
                  const cfg = SEVERITY_CONFIG[s]
                  return (
                    <Badge
                      key={s}
                      variant={form.severity === s ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => updateField("severity", s)}
                    >
                      {cfg.label}
                    </Badge>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="alert-title">Titre</Label>
              <Input
                id="alert-title"
                placeholder="Ex: Faux certificat halal detecte a Lyon"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alert-summary">Resume</Label>
              <Textarea
                id="alert-summary"
                placeholder="Resume court (affiché dans la liste)..."
                value={form.summary}
                onChange={(e) => updateField("summary", e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alert-content">Contenu complet</Label>
              <Textarea
                id="alert-content"
                placeholder="Details de l'alerte..."
                value={form.content}
                onChange={(e) => updateField("content", e.target.value)}
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alert-source">URL source</Label>
              <Input
                id="alert-source"
                placeholder="https://al-kanz.org/..."
                value={form.sourceUrl}
                onChange={(e) => updateField("sourceUrl", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alert-image">Image (URL)</Label>
              <Input
                id="alert-image"
                placeholder="https://..."
                value={form.imageUrl}
                onChange={(e) => updateField("imageUrl", e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                className="flex-1"
                onClick={handleSave}
                disabled={isPending || !form.title || !form.summary || !form.content}
              >
                {editingId ? "Mettre a jour" : "Creer l'alerte"}
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

      {/* ── Delete confirmation dialog ── */}
      <Dialog
        open={deleteDialogId !== null}
        onOpenChange={(open) => !open && setDeleteDialogId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer cette alerte ?</DialogTitle>
            <DialogDescription>
              Cette action est irreversible. L&apos;alerte et son historique de lecture seront supprimes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogId(null)}>
              Annuler
            </Button>
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
