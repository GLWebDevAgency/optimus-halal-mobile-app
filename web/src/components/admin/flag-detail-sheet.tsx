"use client"

import { useState, useEffect } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  TrashSimple,
  Plus,
  X,
  UserCircle,
} from "@phosphor-icons/react"
import { trpc } from "@/lib/trpc"
import { ConfirmDialog } from "./confirm-dialog"

type Props = {
  flagId: string | null
  onClose: () => void
}

const ATTRIBUTES = ["tier", "madhab", "platform", "appVersion"] as const
const OPERATORS = ["eq", "neq", "in", "notIn", "gte", "lte", "semverGte", "semverLte"] as const

const operatorLabels: Record<string, string> = {
  eq: "=",
  neq: "≠",
  in: "dans",
  notIn: "pas dans",
  gte: "≥",
  lte: "≤",
  semverGte: "≥ (semver)",
  semverLte: "≤ (semver)",
}

type RuleOperator = "eq" | "neq" | "in" | "notIn" | "gte" | "lte" | "semverGte" | "semverLte"

interface FlagRule {
  attribute: string
  operator: RuleOperator
  value: string | string[] | number
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function FlagDetailSheet({ flagId, onClose }: Props) {
  const utils = trpc.useUtils()

  const { data, isLoading } = trpc.featureFlags.getById.useQuery(
    { id: flagId! },
    { enabled: !!flagId }
  )

  // Local edit state
  const [label, setLabel] = useState("")
  const [description, setDescription] = useState("")
  const [enabled, setEnabled] = useState(false)
  const [rollout, setRollout] = useState(100)
  const [rules, setRules] = useState<FlagRule[]>([])

  // Override form
  const [overrideUserId, setOverrideUserId] = useState("")
  const [overrideValue, setOverrideValue] = useState("true")
  const [overrideReason, setOverrideReason] = useState("")

  // Sync from server data
  useEffect(() => {
    if (data?.flag) {
      setLabel(data.flag.label)
      setDescription(data.flag.description ?? "")
      setEnabled(data.flag.enabled)
      setRollout(data.flag.rolloutPercentage)
      setRules((Array.isArray(data.flag.rules) ? data.flag.rules : []) as FlagRule[])
    }
  }, [data?.flag])

  const updateMutation = trpc.featureFlags.update.useMutation({
    onSuccess: () => {
      utils.featureFlags.getById.invalidate({ id: flagId! })
      utils.featureFlags.list.invalidate()
    },
  })

  const deleteMutation = trpc.featureFlags.delete.useMutation({
    onSuccess: () => {
      utils.featureFlags.list.invalidate()
      onClose()
    },
  })

  const setOverrideMutation = trpc.featureFlags.setOverride.useMutation({
    onSuccess: () => {
      utils.featureFlags.getById.invalidate({ id: flagId! })
      setOverrideUserId("")
      setOverrideReason("")
    },
  })

  const removeOverrideMutation = trpc.featureFlags.removeOverride.useMutation({
    onSuccess: () => {
      utils.featureFlags.getById.invalidate({ id: flagId! })
    },
  })

  const handleSave = () => {
    if (!flagId) return
    updateMutation.mutate({
      id: flagId,
      label,
      description: description || null,
      enabled,
      rolloutPercentage: rollout,
      rules,
    })
  }

  // Rule helpers
  const addRule = () => {
    setRules([...rules, { attribute: "tier", operator: "eq" as RuleOperator, value: "" }])
  }

  const updateRule = (index: number, field: keyof FlagRule, val: string) => {
    const updated = [...rules]
    if (field === "value" && (updated[index].operator === "in" || updated[index].operator === "notIn")) {
      updated[index] = { ...updated[index], [field]: val.split(",").map((s) => s.trim()) }
    } else if (field === "operator") {
      updated[index] = { ...updated[index], operator: val as RuleOperator }
    } else {
      updated[index] = { ...updated[index], [field]: val }
    }
    setRules(updated)
  }

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index))
  }

  const flag = data?.flag
  const overrides = data?.overrides ?? []

  return (
    <Sheet open={!!flagId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>Détail du flag</SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-4 px-6 pt-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : !flag ? (
          <p className="px-6 pt-4 text-sm text-muted-foreground">Flag introuvable.</p>
        ) : (
          <div className="space-y-6 px-6 pb-6">
            {/* General info */}
            <div className="space-y-3">
              <div>
                <Label>Label</Label>
                <Input value={label} onChange={(e) => setLabel(e.target.value)} />
              </div>
              <div>
                <Label>Key</Label>
                <Input value={flag.key} disabled className="font-mono text-xs" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-3">
                <Label>Activé</Label>
                <Switch
                  checked={enabled}
                  onCheckedChange={(v) => setEnabled(!!v)}
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">{flag.flagType}</Badge>
                <span>Créé le {formatDate(flag.createdAt)}</span>
              </div>
            </div>

            <Separator />

            {/* Rollout */}
            <div className="space-y-2">
              <Label>Rollout progressif</Label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={rollout}
                  onChange={(e) => setRollout(Number(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <span className="w-12 text-right font-mono text-sm">{rollout}%</span>
              </div>
            </div>

            <Separator />

            {/* Targeting Rules */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>Règles de ciblage</Label>
                <Button variant="outline" size="sm" onClick={addRule}>
                  <Plus className="mr-1 size-3" />
                  Ajouter
                </Button>
              </div>
              {rules.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Aucune règle — le flag s&apos;applique à tous les utilisateurs.
                </p>
              ) : (
                <div className="space-y-2">
                  {rules.map((rule, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg border bg-card p-2">
                      <select
                        value={rule.attribute}
                        onChange={(e) => updateRule(i, "attribute", e.target.value)}
                        className="rounded border bg-background px-2 py-1 text-xs"
                      >
                        {ATTRIBUTES.map((a) => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>
                      <select
                        value={rule.operator}
                        onChange={(e) => updateRule(i, "operator", e.target.value)}
                        className="rounded border bg-background px-2 py-1 text-xs"
                      >
                        {OPERATORS.map((op) => (
                          <option key={op} value={op}>{operatorLabels[op]}</option>
                        ))}
                      </select>
                      <Input
                        value={Array.isArray(rule.value) ? rule.value.join(", ") : String(rule.value)}
                        onChange={(e) => updateRule(i, "value", e.target.value)}
                        className="h-7 flex-1 text-xs"
                        placeholder="valeur"
                      />
                      <button
                        onClick={() => removeRule(i)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* User Overrides */}
            <div>
              <div className="mb-2 flex items-center gap-1.5">
                <UserCircle className="size-4" />
                <Label>Overrides utilisateurs ({overrides.length})</Label>
              </div>

              {overrides.length > 0 && (
                <div className="mb-3 max-h-40 space-y-1 overflow-y-auto">
                  {overrides.map((o) => (
                    <div
                      key={o.id}
                      className="flex items-center justify-between rounded px-2 py-1 text-xs hover:bg-accent"
                    >
                      <div>
                        <span className="font-mono">{o.userId.slice(0, 8)}...</span>
                        <span className="ml-2 text-muted-foreground">
                          = {JSON.stringify(o.value)}
                        </span>
                        {o.reason && (
                          <span className="ml-2 text-muted-foreground">({o.reason})</span>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          removeOverrideMutation.mutate({
                            flagId: flag.id,
                            userId: o.userId,
                          })
                        }
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add override form */}
              <div className="space-y-2 rounded-lg border bg-card p-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="User ID (UUID)"
                    value={overrideUserId}
                    onChange={(e) => setOverrideUserId(e.target.value)}
                    className="h-7 flex-1 text-xs"
                  />
                  <select
                    value={overrideValue}
                    onChange={(e) => setOverrideValue(e.target.value)}
                    className="rounded border bg-background px-2 py-1 text-xs"
                  >
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Raison (optionnel)"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    className="h-7 flex-1 text-xs"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!overrideUserId}
                    onClick={() => {
                      setOverrideMutation.mutate({
                        flagId: flag.id,
                        userId: overrideUserId,
                        value: overrideValue === "true",
                        reason: overrideReason || undefined,
                      })
                    }}
                  >
                    <Plus className="mr-1 size-3" />
                    Ajouter
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex items-center justify-between">
              <ConfirmDialog
                trigger={
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-destructive/50 text-destructive hover:bg-destructive/10"
                  >
                    <TrashSimple className="mr-1 size-4" />
                    Supprimer
                  </Button>
                }
                title="Supprimer ce flag ?"
                description={`Le flag "${flag.key}" sera définitivement supprimé avec toutes ses overrides. Requiert super_admin.`}
                confirmLabel="Supprimer"
                variant="destructive"
                onConfirm={() => deleteMutation.mutate({ id: flag.id })}
              />

              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
            </div>

            {updateMutation.isSuccess && (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
                Flag mis à jour avec succès.
              </div>
            )}

            {(updateMutation.isError || deleteMutation.isError) && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {updateMutation.error?.message || deleteMutation.error?.message}
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
