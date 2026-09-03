"use client"

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartTooltip, formatTick } from "@/components/chart-utils"
import type { CategoryExposure } from "@/lib/types"

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

export function CategoryExposureChart({ exposures }: { exposures: CategoryExposure[] }) {
  const chartData = exposures.map((e) => ({
    name: CATEGORY_LABELS[e.category] ?? e.category,
    exposure: e.totalExposure,
    count: e.flagCount,
    fill: CATEGORY_COLORS[e.category] ?? "#64748b",
  }))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Dollar Exposure by Fraud Category</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
              <XAxis type="number" tickFormatter={formatTick} fontSize={11} />
              <YAxis type="category" dataKey="name" width={170} fontSize={11} tick={{ fill: "var(--foreground)" }} />
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
