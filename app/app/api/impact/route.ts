import { querySnowflake } from "@/lib/snowflake"
import { toIso } from "@/lib/format"
import type { ImpactData, CategoryExposure, CaseStudy, ImpactWaterfall } from "@/lib/types"

export const dynamic = "force-dynamic"

const GAO_RECOVERY_RATIO = 1.72
const RECOVERY_RATE = 0.50

export async function GET() {
  try {
    const [totalRows, categoryRows, rulesFlaggedRows, mlOnlyRows, caseGhostRows, caseDupeRows, caseTimeRows] =
      await Promise.all([
        querySnowflake(`
          SELECT COUNT(*) AS CNT, SUM(PAYMENT_AMOUNT) AS TOTAL_AMT
          FROM CGFS_FRAUD_DEMO.ANALYTICS.UNIFIED_TRANSACTIONS
        `),
        querySnowflake("SELECT * FROM CGFS_FRAUD_DEMO.ANALYTICS.FRAUD_SUMMARY_BY_CATEGORY ORDER BY TOTAL_EXPOSURE DESC"),
        querySnowflake(`
          SELECT COUNT(DISTINCT TRANSACTION_ID) AS CNT, SUM(ESTIMATED_IMPROPER_AMOUNT) AS AMT
          FROM CGFS_FRAUD_DEMO.ANALYTICS.RULES_ENGINE_FLAGS
        `),
        querySnowflake(`
          SELECT COUNT(*) AS CNT, SUM(TOTAL_ESTIMATED_LOSS) AS AMT
          FROM CGFS_FRAUD_DEMO.ANALYTICS.FRAUD_RISK_SUMMARY
          WHERE ML_ANOMALY_SCORE IS NOT NULL
            AND TRANSACTION_ID NOT IN (SELECT DISTINCT TRANSACTION_ID FROM CGFS_FRAUD_DEMO.ANALYTICS.RULES_ENGINE_FLAGS)
        `),
        querySnowflake(`
          SELECT r.TRANSACTION_ID, r.EXPLANATION, r.ESTIMATED_IMPROPER_AMOUNT,
                 t.VENDOR_NAME, t.DISBURSEMENT_DATE, t.SOURCE_SYSTEM
          FROM CGFS_FRAUD_DEMO.ANALYTICS.RULES_ENGINE_FLAGS r
          JOIN CGFS_FRAUD_DEMO.ANALYTICS.UNIFIED_TRANSACTIONS t ON r.TRANSACTION_ID = t.TRANSACTION_ID
          WHERE r.RULE_CATEGORY = 'PAYROLL_FRAUD'
          ORDER BY r.ESTIMATED_IMPROPER_AMOUNT DESC
          LIMIT 1
        `),
        querySnowflake(`
          SELECT r.TRANSACTION_ID, r.EXPLANATION, r.ESTIMATED_IMPROPER_AMOUNT,
                 t.VENDOR_NAME, t.DISBURSEMENT_DATE, t.SOURCE_SYSTEM
          FROM CGFS_FRAUD_DEMO.ANALYTICS.RULES_ENGINE_FLAGS r
          JOIN CGFS_FRAUD_DEMO.ANALYTICS.UNIFIED_TRANSACTIONS t ON r.TRANSACTION_ID = t.TRANSACTION_ID
          WHERE r.RULE_CATEGORY = 'DUPLICATE_PAYMENT'
          ORDER BY r.ESTIMATED_IMPROPER_AMOUNT DESC
          LIMIT 1
        `),
        querySnowflake(`
          SELECT r.TRANSACTION_ID, r.EXPLANATION, r.ESTIMATED_IMPROPER_AMOUNT,
                 NULL AS VENDOR_NAME, r.FLAGGED_AT AS DISBURSEMENT_DATE, 'GFACS/gTA' AS SOURCE_SYSTEM
          FROM CGFS_FRAUD_DEMO.ANALYTICS.RULES_ENGINE_FLAGS r
          WHERE r.RULE_CATEGORY = 'TIME_PAY_MISMATCH'
          ORDER BY r.ESTIMATED_IMPROPER_AMOUNT DESC
          LIMIT 1
        `),
      ])

    const totalPayments = Number(totalRows[0]?.CNT ?? 0)
    const totalPaymentAmount = Number(totalRows[0]?.TOTAL_AMT ?? 0)
    const rulesCaught = Number(rulesFlaggedRows[0]?.CNT ?? 0)
    const rulesCaughtAmount = Number(rulesFlaggedRows[0]?.AMT ?? 0)
    const mlCaught = Number(mlOnlyRows[0]?.CNT ?? 0)
    const mlCaughtAmount = Number(mlOnlyRows[0]?.AMT ?? 0)

    const waterfall: ImpactWaterfall = {
      totalPayments,
      totalPaymentAmount,
      rulesCaught,
      rulesCaughtAmount,
      mlCaught,
      mlCaughtAmount,
      cleanTransactions: totalPayments - rulesCaught - mlCaught,
      cleanAmount: totalPaymentAmount - rulesCaughtAmount - mlCaughtAmount,
    }

    const categoryExposures: CategoryExposure[] = categoryRows.map((r: Record<string, unknown>) => {
      const exposure = Number(r.TOTAL_EXPOSURE ?? 0)
      return {
        category: String(r.FRAUD_CATEGORY ?? ""),
        flagCount: Number(r.FLAG_COUNT ?? 0),
        totalExposure: exposure,
        recoveryCost: exposure * GAO_RECOVERY_RATIO,
        preventionValue: exposure + exposure * GAO_RECOVERY_RATIO * (1 - RECOVERY_RATE),
      }
    })

    const totalExposure = categoryExposures.reduce((sum, c) => sum + c.totalExposure, 0)

    function buildCase(rows: Record<string, unknown>[], type: string, title: string, systems: string[], steps: { system: string; detail: string }[]): CaseStudy | null {
      if (rows.length === 0) return null
      const r = rows[0]
      return {
        id: String(r.TRANSACTION_ID ?? ""),
        type,
        title,
        description: String(r.EXPLANATION ?? ""),
        amount: Number(r.ESTIMATED_IMPROPER_AMOUNT ?? 0),
        systems,
        steps,
      }
    }

    const caseStudies: CaseStudy[] = [
      buildCase(caseGhostRows, "GHOST_EMPLOYEE", "Ghost Employee Payment",
        ["GFACS", "GFMS"],
        [
          { system: "GFACS", detail: `Employee separated (${toIso(caseGhostRows[0]?.DISBURSEMENT_DATE)?.slice(0, 10) ?? "unknown"})` },
          { system: caseGhostRows[0]?.SOURCE_SYSTEM as string ?? "GFMS", detail: `Payment of ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(caseGhostRows[0]?.ESTIMATED_IMPROPER_AMOUNT ?? 0))} after separation` },
          { system: "DETECTION", detail: "Cross-system join: GFACS separation date vs payment date" },
        ]),
      buildCase(caseDupeRows, "CROSS_BOUNDARY_DUPLICATE", "Cross-Boundary Duplicate Payment",
        ["GFMS", "RFMS"],
        [
          { system: "GFMS", detail: `Domestic payment to ${caseDupeRows[0]?.VENDOR_NAME ?? "vendor"}` },
          { system: "RFMS", detail: `Overseas payment to same vendor, overlapping dates` },
          { system: "DETECTION", detail: "Virtual Merge cannot catch this \u2014 funds exist in both systems" },
        ]),
      buildCase(caseTimeRows, "TIME_PAY_MISMATCH", "Time/Pay Mismatch",
        ["gTA", "GFACS"],
        [
          { system: "gTA", detail: "Extended leave recorded in time system" },
          { system: "GFACS", detail: "Full regular-hours pay disbursed for same period" },
          { system: "DETECTION", detail: "Cross-system join: leave hours vs compensation" },
        ]),
    ].filter((c): c is CaseStudy => c !== null)

    const data: ImpactData = {
      waterfall,
      categoryExposures,
      totalPreventionSavings: totalExposure * GAO_RECOVERY_RATIO,
      caseStudies,
    }

    return Response.json(data)
  } catch (e) {
    console.error(new Date().toISOString(), "[impact]", e)
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to load impact data" },
      { status: 500 },
    )
  }
}
