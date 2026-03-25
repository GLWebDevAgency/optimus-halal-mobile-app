"use client"

import { useId } from "react"
import { cn } from "@/lib/utils"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

type AreaChartCardProps = {
  title: string
  data: { date: string; count: number }[]
  color?: string
  className?: string
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
}

export function AreaChartCard({
  title,
  data,
  color = "hsl(var(--primary))",
  className,
}: AreaChartCardProps) {
  const gradientId = `gradient-${useId()}`

  return (
    <div className={cn("rounded-xl border bg-card p-4", className)}>
      <h3 className="mb-4 text-sm font-medium text-muted-foreground">{title}</h3>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
                color: "hsl(var(--foreground))",
              }}
              labelFormatter={(label) => formatDate(String(label))}
              formatter={(value) => [Number(value).toLocaleString("fr-FR"), ""]}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke={color}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
