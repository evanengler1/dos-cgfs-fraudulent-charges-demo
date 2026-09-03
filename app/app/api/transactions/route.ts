import { querySnowflake } from "@/lib/snowflake"
import { toIso } from "@/lib/format"
import type { FlaggedTransaction, TransactionListResponse } from "@/lib/types"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1)
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 25))
    const offset = (page - 1) * pageSize

    const conditions: string[] = []
    const binds: (string | number)[] = []

    const tier = url.searchParams.get("tier")
    if (tier) { conditions.push("RISK_TIER = ?"); binds.push(tier) }

    const category = url.searchParams.get("category")
    if (category) {
      conditions.push(`TRANSACTION_ID IN (
        SELECT TRANSACTION_ID FROM CGFS_FRAUD_DEMO.ANALYTICS.RULES_ENGINE_FLAGS WHERE RULE_CATEGORY = ?
      )`)
      binds.push(category)
    }

    const source = url.searchParams.get("source")
    if (source) { conditions.push("SOURCE_SYSTEM = ?"); binds.push(source) }

    const post = url.searchParams.get("post")
    if (post) { conditions.push("POST_ID = ?"); binds.push(post) }

    const dateFrom = url.searchParams.get("dateFrom")
    if (dateFrom) { conditions.push("DISBURSEMENT_DATE >= ?"); binds.push(dateFrom) }

    const dateTo = url.searchParams.get("dateTo")
    if (dateTo) { conditions.push("DISBURSEMENT_DATE <= ?"); binds.push(dateTo) }

    const amountMin = url.searchParams.get("amountMin")
    if (amountMin) { conditions.push("PAYMENT_AMOUNT >= ?"); binds.push(Number(amountMin)) }

    const amountMax = url.searchParams.get("amountMax")
    if (amountMax) { conditions.push("PAYMENT_AMOUNT <= ?"); binds.push(Number(amountMax)) }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

    const countSql = `SELECT COUNT(*) AS CNT FROM CGFS_FRAUD_DEMO.ANALYTICS.FRAUD_RISK_SUMMARY ${whereClause}`
    const dataSql = `
      SELECT * FROM CGFS_FRAUD_DEMO.ANALYTICS.FRAUD_RISK_SUMMARY
      ${whereClause}
      ORDER BY RISK_SCORE DESC
      LIMIT ? OFFSET ?
    `

    const [countRows, dataRows] = await Promise.all([
      querySnowflake(countSql, { binds }),
      querySnowflake(dataSql, { binds: [...binds, pageSize, offset] }),
    ])

    const total = Number(countRows[0]?.CNT ?? 0)

    const transactions: FlaggedTransaction[] = dataRows.map((r: Record<string, unknown>) => ({
      transactionId: String(r.TRANSACTION_ID ?? ""),
      sourceSystem: String(r.SOURCE_SYSTEM ?? ""),
      vendorId: String(r.VENDOR_ID ?? ""),
      vendorName: String(r.VENDOR_NAME ?? ""),
      paymentAmount: Number(r.PAYMENT_AMOUNT ?? 0),
      disbursementDate: toIso(r.DISBURSEMENT_DATE)?.slice(0, 10) ?? "",
      postId: r.POST_ID ? String(r.POST_ID) : null,
      riskScore: Number(r.RISK_SCORE ?? 0),
      riskTier: String(r.RISK_TIER ?? ""),
      flags: Array.isArray(r.FLAGS) ? r.FLAGS.map(String) : [],
      totalEstimatedLoss: Number(r.TOTAL_ESTIMATED_LOSS ?? 0),
      recommendedAction: String(r.RECOMMENDED_ACTION ?? ""),
      mlAnomalyScore: r.ML_ANOMALY_SCORE != null ? Number(r.ML_ANOMALY_SCORE) : null,
    }))

    const response: TransactionListResponse = { transactions, total, page, pageSize }
    return Response.json(response)
  } catch (e) {
    console.error(new Date().toISOString(), "[transactions]", e)
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to load transactions" },
      { status: 500 },
    )
  }
}
