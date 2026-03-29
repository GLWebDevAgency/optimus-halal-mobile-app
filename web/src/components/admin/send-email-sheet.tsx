"use client"

import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import {
  EnvelopeSimple,
  RocketLaunch,
  Star,
  Timer,
  Hourglass,
  CheckCircle,
  WarningCircle,
  PaperPlaneTilt,
  SpinnerGap,
} from "@phosphor-icons/react"
import { trpc } from "@/lib/trpc"
import { ConfirmDialog } from "./confirm-dialog"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type Template = "waitlist_confirmation" | "welcome" | "trial_reminder" | "trial_expired" | "launch"

interface TemplateOption {
  id: Template
  label: string
  description: string
  icon: React.ReactNode
  color: string
}

const templates: TemplateOption[] = [
  {
    id: "waitlist_confirmation",
    label: "Confirmation Waitlist",
    description: "Remerciement pour l'inscription à la liste d'attente.",
    icon: <EnvelopeSimple weight="duotone" className="size-5" />,
    color: "text-blue-500 bg-blue-500/10",
  },
  {
    id: "welcome",
    label: "Bienvenue + Trial 7j",
    description: "Email de bienvenue avec offre d'essai Naqiy+ 7 jours.",
    icon: <Star weight="duotone" className="size-5" />,
    color: "text-amber-500 bg-amber-500/10",
  },
  {
    id: "trial_reminder",
    label: "Rappel Trial (J5)",
    description: "Il reste 2 jours d'essai Naqiy+ — encourager la conversion.",
    icon: <Timer weight="duotone" className="size-5" />,
    color: "text-orange-500 bg-orange-500/10",
  },
  {
    id: "trial_expired",
    label: "Trial Expiré (J7)",
    description: "Fin de l'essai — choix entre s'abonner ou rester en gratuit.",
    icon: <Hourglass weight="duotone" className="size-5" />,
    color: "text-red-500 bg-red-500/10",
  },
  {
    id: "launch",
    label: "Notification de Lancement",
    description: "Annonce officielle — l'app est disponible, viens la découvrir.",
    icon: <RocketLaunch weight="duotone" className="size-5" />,
    color: "text-emerald-500 bg-emerald-500/10",
  },
]

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedIds: Set<string>
  onSuccess: () => void
}

export function SendEmailSheet({ open, onOpenChange, selectedIds, onSuccess }: Props) {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)

  const sendMutation = trpc.adminWaitlist.sendBulkEmail.useMutation({
    onSuccess: (result) => {
      if (result.failed === 0) {
        toast.success(`${result.sent} email(s) envoyé(s) avec succès`)
      } else {
        toast.warning(`${result.sent} envoyé(s), ${result.failed} échoué(s) sur ${result.total}`)
      }
      setSelectedTemplate(null)
      onOpenChange(false)
      onSuccess()
    },
    onError: (err) => {
      toast.error(`Erreur : ${err.message}`)
    },
  })

  const count = selectedIds.size
  const selected = templates.find((t) => t.id === selectedTemplate)

  const handleSend = () => {
    if (!selectedTemplate) return
    sendMutation.mutate({
      ids: [...selectedIds],
      template: selectedTemplate,
    })
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) setSelectedTemplate(null)
        onOpenChange(v)
      }}
    >
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="flex items-center gap-2">
            <PaperPlaneTilt weight="duotone" className="size-5 text-primary" />
            Envoyer un email
          </SheetTitle>
          <SheetDescription>
            {count} destinataire{count > 1 ? "s" : ""} sélectionné{count > 1 ? "s" : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Choisir un template
          </p>
          <div className="space-y-2">
            {templates.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => setSelectedTemplate(tpl.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                  selectedTemplate === tpl.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border hover:bg-accent/50"
                )}
              >
                <div className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md", tpl.color)}>
                  {tpl.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{tpl.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{tpl.description}</p>
                </div>
                {selectedTemplate === tpl.id && (
                  <CheckCircle weight="fill" className="ml-auto mt-0.5 size-5 shrink-0 text-primary" />
                )}
              </button>
            ))}
          </div>

          {sendMutation.isSuccess && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
              <CheckCircle weight="fill" className="size-4 shrink-0" />
              {sendMutation.data.sent} email(s) envoyé(s)
              {sendMutation.data.failed > 0 && (
                <span className="text-amber-600 dark:text-amber-400">
                  , {sendMutation.data.failed} échoué(s)
                </span>
              )}
            </div>
          )}

          {sendMutation.isError && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <WarningCircle weight="fill" className="size-4 shrink-0" />
              {sendMutation.error.message}
            </div>
          )}
        </div>

        <SheetFooter className="border-t pt-4">
          <div className="flex w-full items-center gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <ConfirmDialog
              trigger={
                <Button
                  className="flex-1"
                  disabled={!selectedTemplate || sendMutation.isPending}
                >
                  {sendMutation.isPending ? (
                    <>
                      <SpinnerGap className="mr-1.5 size-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <PaperPlaneTilt className="mr-1.5 size-4" />
                      Envoyer ({count})
                    </>
                  )}
                </Button>
              }
              title="Confirmer l'envoi"
              description={`Envoyer l'email "${selected?.label ?? ""}" à ${count} destinataire${count > 1 ? "s" : ""} ? Cette action est irréversible.`}
              confirmLabel="Envoyer"
              onConfirm={handleSend}
            />
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
