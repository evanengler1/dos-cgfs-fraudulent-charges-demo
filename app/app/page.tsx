import { querySnowflake } from "@/lib/snowflake"
import { toIso } from "@/lib/format"
import { DashboardClient } from "@/components/dashboard-client"
import type { DashboardData, CategorySummary, MonthlyTrend, RiskTierDistribution } from "@/lib/types"

export const dynamic = "force-dynamic"

const GAO_RECOVERY_RATIO = 1.72

export default async function DashboardPage() {
  const [totalRows, flaggedRows, categoryRows, trendRows, tierRows] = await Promise.all([
    querySnowflake("SELECT COUNT(*) AS CNT FROM CGFS_FRAUD_DEMO.ANALYTICS.UNIFIED_TRANSACTIONS"),
    querySnowflake(`
      SELECT COUNT(*) AS FLAGGED_COUNT, SUM(TOTAL_ESTIMATED_LOSS) AS TOTAL_EXPOSURE
      FROM CGFS_FRAUD_DEMO.ANALYTICS.FRAUD_RISK_SUMMARY
    `),
    querySnowflake("SELECT * FROM CGFS_FRAUD_DEMO.ANALYTICS.FRAUD_SUMMARY_BY_CATEGORY ORDER BY TOTAL_EXPOSURE DESC"),
    querySnowflake("SELECT * FROM CGFS_FRAUD_DEMO.ANALYTICS.FRAUD_TREND_MONTHLY ORDER BY TREND_MONTH, FRAUD_CATEGORY"),
    querySnowflake(`
      SELECT RISK_TIER, COUNT(*) AS CNT
      FROM CGFS_FRAUD_DEMO.ANALYTICS.FRAUD_RISK_SUMMARY
      GROUP BY RISK_TIER
      ORDER BY CASE RISK_TIER WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END
    `),
  ])

  const totalTransactions = Number(totalRows[0]?.CNT ?? 0)
  const totalFlagged = Number(flaggedRows[0]?.FLAGGED_COUNT ?? 0)
  const totalExposure = Number(flaggedRows[0]?.TOTAL_EXPOSURE ?? 0)

  const data: DashboardData = {
    kpis: {
      totalTransactions,
      totalFlagged,
      totalExposure,
      preventionSavings: totalExposure * GAO_RECOVERY_RATIO,
      flagRate: totalTransactions > 0 ? totalFlagged / totalTransactions : 0,
    },
    categories: categoryRows.map((r: Record<string, unknown>): CategorySummary => ({
      category: String(r.FRAUD_CATEGORY ?? ""),
      ruleName: String(r.RULE_NAME ?? ""),
      flagCount: Number(r.FLAG_COUNT ?? 0),
      totalExposure: Number(r.TOTAL_EXPOSURE ?? 0),
      avgAmount: Number(r.AVG_AMOUNT ?? 0),
      criticalCount: Number(r.CRITICAL_COUNT ?? 0),
      highCount: Number(r.HIGH_COUNT ?? 0),
    })),
    monthlyTrends: trendRows.map((r: Record<string, unknown>): MonthlyTrend => ({
      month: toIso(r.TREND_MONTH)?.slice(0, 7) ?? "",
      category: String(r.FRAUD_CATEGORY ?? ""),
      flagCount: Number(r.FLAG_COUNT ?? 0),
      totalExposure: Number(r.TOTAL_EXPOSURE ?? 0),
    })),
    riskDistribution: tierRows.map((r: Record<string, unknown>): RiskTierDistribution => ({
      tier: String(r.RISK_TIER ?? ""),
      count: Number(r.CNT ?? 0),
    })),
  }

  return <DashboardClient data={data} />
}
