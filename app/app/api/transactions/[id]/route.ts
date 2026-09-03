import { querySnowflake } from "@/lib/snowflake"
import { toIso } from "@/lib/format"
import type { TransactionDetail, RuleFlag, RelatedTransaction, FlaggedTransaction } from "@/lib/types"

export const dynamic = "force-dynamic"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const [txRows, ruleRows, mlRows, relatedRows] = await Promise.all([
      querySnowflake(
        "SELECT * FROM CGFS_FRAUD_DEMO.ANALYTICS.FRAUD_RISK_SUMMARY WHERE TRANSACTION_ID = ?",
        { binds: [id] },
      ),
      querySnowflake(
        "SELECT * FROM CGFS_FRAUD_DEMO.ANALYTICS.RULES_ENGINE_FLAGS WHERE TRANSACTION_ID = ? ORDER BY SEVERITY",
        { binds: [id] },
      ),
      querySnowflake(
        "SELECT * FROM CGFS_FRAUD_DEMO.ANALYTICS.ML_ANOMALY_FLAGS WHERE TRANSACTION_ID = ?",
        { binds: [id] },
      ),
      querySnowflake(`
        SELECT t.TRANSACTION_ID, t.SOURCE_SYSTEM, t.VENDOR_NAME, t.PAYMENT_AMOUNT,
               t.DISBURSEMENT_DATE, t.DESCRIPTION
        FROM CGFS_FRAUD_DEMO.ANALYTICS.UNIFIED_TRANSACTIONS t
        INNER JOIN CGFS_FRAUD_DEMO.ANALYTICS.FRAUD_RISK_SUMMARY frs ON frs.TRANSACTION_ID = ?
        WHERE (t.VENDOR_ID = frs.VENDOR_ID OR t.OBLIGATION_ID = frs.OBLIGATION_ID)
          AND t.TRANSACTION_ID != ?
        LIMIT 20
      `, { binds: [id, id] }),
    ])

    if (txRows.length === 0) {
      return Response.json({ error: "Transaction not found" }, { status: 404 })
    }

    const r = txRows[0] as Record<string, unknown>
    const transaction: FlaggedTransaction = {
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
    }

    const rules: RuleFlag[] = ruleRows.map((row: Record<string, unknown>) => ({
      ruleId: String(row.RULE_ID ?? ""),
      ruleName: String(row.RULE_NAME ?? ""),
      ruleCategory: String(row.RULE_CATEGORY ?? ""),
      severity: String(row.SEVERITY ?? ""),
      confidence: Number(row.CONFIDENCE ?? 0),
      estimatedImproperAmount: Number(row.ESTIMATED_IMPROPER_AMOUNT ?? 0),
      explanation: String(row.EXPLANATION ?? ""),
      flaggedAt: toIso(row.FLAGGED_AT) ?? "",
    }))

    const mlScore = mlRows.length > 0 ? Number((mlRows[0] as Record<string, unknown>).ANOMALY_SCORE ?? 0) : null

    const relatedTransactions: RelatedTransaction[] = relatedRows.map((row: Record<string, unknown>) => ({
      transactionId: String(row.TRANSACTION_ID ?? ""),
      sourceSystem: String(row.SOURCE_SYSTEM ?? ""),
      vendorName: String(row.VENDOR_NAME ?? ""),
      paymentAmount: Number(row.PAYMENT_AMOUNT ?? 0),
      disbursementDate: toIso(row.DISBURSEMENT_DATE)?.slice(0, 10) ?? "",
      description: String(row.DESCRIPTION ?? ""),
    }))

    const detail: TransactionDetail = { transaction, rules, mlScore, relatedTransactions }
    return Response.json(detail)
  } catch (e) {
    console.error(new Date().toISOString(), "[transaction-detail]", e)
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to load transaction detail" },
      { status: 500 },
    )
  }
}
