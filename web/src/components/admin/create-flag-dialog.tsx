"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { trpc } from "@/lib/trpc"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateFlagDialog({ open, onOpenChange }: Props) {
  const utils = trpc.useUtils()

  const [key, setKey] = useState("")
  const [label, setLabel] = useState("")
  const [description, setDescription] = useState("")
  const [flagType, setFlagType] = useState<"boolean" | "percentage" | "variant">("boolean")

  const createMutation = trpc.featureFlags.create.useMutation({
    onSuccess: () => {
      utils.featureFlags.list.invalidate()
      onOpenChange(false)
      setKey("")
      setLabel("")
      setDescription("")
      setFlagType("boolean")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!key || !label) return
    createMutation.mutate({
      key,
      label,
      description: description || undefined,
      flagType,
      enabled: false,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Créer un feature flag</DialogTitle>
          <DialogDescription>
            Le flag sera créé désactivé. Vous pourrez le configurer ensuite.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="flag-key">Key</Label>
            <Input
              id="flag-key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="myNewFeature"
              className="font-mono text-sm"
              pattern="^[a-zA-Z][a-zA-Z0-9_]*$"
              required
            />
            <p className="text-xs text-muted-foreground">
              camelCase ou snake_case, commence par une lettre.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="flag-label">Label</Label>
            <Input
              id="flag-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ma nouvelle fonctionnalité"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="flag-desc">Description</Label>
            <Textarea
              id="flag-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description optionnelle..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <div className="flex gap-2">
              {(["boolean", "percentage", "variant"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFlagType(t)}
                  className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                    flagType === t
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {t === "boolean" ? "Boolean" : t === "percentage" ? "Rollout %" : "A/B Variant"}
                </button>
              ))}
            </div>
          </div>

          {createMutation.isError && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {createMutation.error.message}
            </div>
          )}

          <DialogFooter>
            <DialogClose render={<Button variant="outline">Annuler</Button>} />
            <Button type="submit" disabled={createMutation.isPending || !key || !label}>
              {createMutation.isPending ? "Création..." : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
