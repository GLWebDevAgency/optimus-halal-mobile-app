"use client"

import { cn } from "@/lib/utils"
import { TrendUp, TrendDown, Minus } from "@phosphor-icons/react"

type KpiCardProps = {
  label: string
  value: string | number
  trend?: number | null
  icon?: React.ReactNode
  className?: string
}

export function KpiCard({ label, value, trend, icon, className }: KpiCardProps) {
  const formattedValue =
    typeof value === "number"
      ? value >= 1_000_000
        ? `${(value / 1_000_000).toFixed(1)}M`
        : value >= 1_000
          ? `${(value / 1_000).toFixed(1)}k`
          : value.toLocaleString("fr-FR")
      : value

  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-800 bg-zinc-900/50 p-4",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-zinc-500">{label}</p>
        {icon && <div className="text-zinc-600">{icon}</div>}
      </div>
      <div className="mt-2 flex items-end gap-2">
        <p className="text-2xl font-bold text-zinc-50">{formattedValue}</p>
        {trend != null && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              trend > 0
                ? "text-emerald-400"
                : trend < 0
                  ? "text-red-400"
                  : "text-zinc-500"
            )}
          >
            {trend > 0 ? (
              <TrendUp className="size-3" weight="bold" />
            ) : trend < 0 ? (
              <TrendDown className="size-3" weight="bold" />
            ) : (
              <Minus className="size-3" weight="bold" />
            )}
            {trend > 0 ? "+" : ""}
            {trend}%
          </span>
        )}
      </div>
    </div>
  )
}
