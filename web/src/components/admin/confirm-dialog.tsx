"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type ConfirmDialogProps = {
  trigger: React.ReactElement
  title: string
  description: string
  confirmLabel?: string
  variant?: "default" | "destructive"
  onConfirm: () => void
}

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Confirmer",
  variant = "default",
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={trigger} />
      <AlertDialogContent className="border-zinc-800 bg-zinc-900">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-zinc-50">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700">
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={
              variant === "destructive"
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-gold text-zinc-950 hover:bg-gold/90"
            }
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
