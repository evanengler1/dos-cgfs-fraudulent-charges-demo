"use client"

import { KPICard } from "@/components/kpi-card"
import { CategoryBarChart } from "@/components/category-bar-chart"
import { MonthlyTrendChart } from "@/components/monthly-trend-chart"
import { RiskTierDonut } from "@/components/risk-tier-donut"
import { Card, CardContent } from "@/components/ui/card"
import { formatDollars, formatNumber, formatPercent } from "@/lib/format"
import type { DashboardData } from "@/lib/types"
import { AlertTriangle } from "lucide-react"

export function DashboardClient({ data }: { data: DashboardData }) {
  const { kpis, categories, monthlyTrends, riskDistribution } = data

  return (
    <main className="w-full py-6 px-4 space-y-6">
      <div>
        <h1 className="text-xl font-bold">Executive Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Cross-system improper payment detection across GFMS, RFMS, GFACS, and gTA
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Transactions Analyzed"
          value={formatNumber(kpis.totalTransactions)}
          subtitle="FY2024-FY2025 combined"
        />
        <KPICard
          label="Flagged Transactions"
          value={formatNumber(kpis.totalFlagged)}
          subtitle={`${formatPercent(kpis.flagRate)} flag rate`}
        />
        <KPICard
          label="Total Dollar Exposure"
          value={formatDollars(kpis.totalExposure)}
          subtitle="Estimated improper payments"
        />
        <KPICard
          label="Prevention Savings"
          value={formatDollars(kpis.preventionSavings)}
          subtitle="Avoided recovery costs (GAO $1.72/$1)"
        />
      </div>

      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
        <CardContent className="pt-4 pb-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Recovering improper payments costs ~$1.72 per $1.00 recovered (GAO).
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
              Prevention eliminates both the loss and the recovery cost. Based on{" "}
              {formatDollars(kpis.totalExposure)} in flagged transactions, the avoided recovery
              cost alone is {formatDollars(kpis.preventionSavings)}.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryBarChart data={categories} />
        <MonthlyTrendChart data={monthlyTrends} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RiskTierDonut data={riskDistribution} />
        <Card>
          <div className="p-6">
            <h3 className="text-base font-semibold mb-4">Top Fraud Categories by Exposure</h3>
            <div className="space-y-3">
              {categories.map((cat) => (
                <div key={cat.category} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{cat.ruleName}</span>
                    <span className="text-muted-foreground ml-2">({cat.flagCount} flags)</span>
                  </div>
                  <span className="font-mono font-semibold">{formatDollars(cat.totalExposure)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}
