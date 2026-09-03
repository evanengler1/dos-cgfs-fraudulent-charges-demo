"use client"

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartTooltip, getYAxisWidth, formatTick } from "@/components/chart-utils"
import type { CategorySummary } from "@/lib/types"

const CATEGORY_COLORS: Record<string, string> = {
  OBLIGATION_BREACH: "#dc2626",
  DUPLICATE_PAYMENT: "#ea580c",
  SPLIT_PAYMENT: "#ca8a04",
  PAYROLL_FRAUD: "#7c3aed",
  VENDOR_RISK: "#0891b2",
  TIME_PAY_MISMATCH: "#2563eb",
}

const CATEGORY_LABELS: Record<string, string> = {
  OBLIGATION_BREACH: "Over-Obligation",
  DUPLICATE_PAYMENT: "Cross-Boundary Duplicate",
  SPLIT_PAYMENT: "Split Payment",
  PAYROLL_FRAUD: "Ghost Employee",
  VENDOR_RISK: "Debarred Vendor",
  TIME_PAY_MISMATCH: "Time/Pay Mismatch",
}

export function CategoryBarChart({ data }: { data: CategorySummary[] }) {
  const chartData = data.map((d) => ({
    name: CATEGORY_LABELS[d.category] ?? d.category,
    exposure: d.totalExposure,
    count: d.flagCount,
    fill: CATEGORY_COLORS[d.category] ?? "#64748b",
  }))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Flagged Transactions by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
              <XAxis type="number" tickFormatter={formatTick} fontSize={11} />
              <YAxis type="category" dataKey="name" width={160} fontSize={11} tick={{ fill: "var(--foreground)" }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="exposure" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export { CATEGORY_COLORS, CATEGORY_LABELS }
