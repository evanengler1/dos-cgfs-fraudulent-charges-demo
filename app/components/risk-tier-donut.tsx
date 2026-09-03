"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { RiskTierDistribution } from "@/lib/types"

const TIER_COLORS: Record<string, string> = {
  CRITICAL: "#dc2626",
  HIGH: "#ea580c",
  MEDIUM: "#ca8a04",
  LOW: "#16a34a",
}

export function RiskTierDonut({ data }: { data: RiskTierDistribution[] }) {
  const chartData = data.map((d) => ({
    name: d.tier,
    value: d.count,
    fill: TIER_COLORS[d.tier] ?? "#64748b",
  }))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Risk Tier Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
                label={({ name, value }: { name?: string; value?: number }) => `${name ?? ""}: ${value ?? 0}`}
                labelLine={{ strokeWidth: 1 }}
                fontSize={11}
              >
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
