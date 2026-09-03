"use client"

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartTooltip, getYAxisWidth, formatTick } from "@/components/chart-utils"
import type { MonthlyTrend } from "@/lib/types"
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/components/category-bar-chart"

export function MonthlyTrendChart({ data }: { data: MonthlyTrend[] }) {
  const months = [...new Set(data.map((d) => d.month))].sort()
  const categories = [...new Set(data.map((d) => d.category))]

  const chartData = months.map((month) => {
    const row: Record<string, string | number> = { month }
    for (const cat of categories) {
      const item = data.find((d) => d.month === month && d.category === cat)
      row[cat] = item?.totalExposure ?? 0
    }
    return row
  })

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Monthly Fraud Exposure Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
              <XAxis
                dataKey="month"
                fontSize={11}
                tick={{ fill: "var(--foreground)" }}
                tickFormatter={(v: string) => {
                  const [y, m] = v.split("-")
                  return `${m}/${y.slice(2)}`
                }}
              />
              <YAxis
                width={getYAxisWidth(chartData, categories[0] ?? "0")}
                tickFormatter={formatTick}
                fontSize={11}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend
                formatter={(value: string) => CATEGORY_LABELS[value] ?? value}
                wrapperStyle={{ fontSize: 11 }}
              />
              {categories.map((cat) => (
                <Line
                  key={cat}
                  type="monotone"
                  dataKey={cat}
                  stroke={CATEGORY_COLORS[cat] ?? "#64748b"}
                  strokeWidth={2}
                  dot={false}
                  name={cat}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
