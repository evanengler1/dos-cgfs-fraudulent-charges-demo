"use client"

import { useQuery } from "@tanstack/react-query"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDollarsExact, formatDate, riskTierBadgeClass } from "@/lib/format"
import type { TransactionDetail } from "@/lib/types"
import { Download, Shield, Brain, FileText, ArrowRight } from "lucide-react"

interface Props {
  transactionId: string | null
  open: boolean
  onClose: () => void
}

export function TransactionDetailSheet({ transactionId, open, onClose }: Props) {
  const { data, isLoading } = useQuery<TransactionDetail>({
    queryKey: ["transaction-detail", transactionId],
    queryFn: () => fetch(`/api/transactions/${transactionId}`).then((r) => r.json()),
    enabled: !!transactionId,
  })

  function handleExport() {
    if (!data) return
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `audit-${data.transaction.transactionId}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Transaction Detail
          </SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-4 mt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : data ? (
          <div className="space-y-4 mt-4">
            {/* Header info */}
            <Card>
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">{data.transaction.transactionId}</span>
                  <Badge className={riskTierBadgeClass(data.transaction.riskTier)}>
                    {data.transaction.riskTier}
                  </Badge>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Source:</span> {data.transaction.sourceSystem}</div>
                  <div><span className="text-muted-foreground">Amount:</span> {formatDollarsExact(data.transaction.paymentAmount)}</div>
                  <div><span className="text-muted-foreground">Vendor:</span> {data.transaction.vendorName}</div>
                  <div><span className="text-muted-foreground">Date:</span> {formatDate(data.transaction.disbursementDate)}</div>
                  {data.transaction.postId && (
                    <div><span className="text-muted-foreground">Post:</span> {data.transaction.postId}</div>
                  )}
                  <div><span className="text-muted-foreground">Risk Score:</span> {data.transaction.riskScore.toFixed(1)}</div>
                  <div><span className="text-muted-foreground">Action:</span> {data.transaction.recommendedAction}</div>
                  <div><span className="text-muted-foreground">Loss Est.:</span> {formatDollarsExact(data.transaction.totalEstimatedLoss)}</div>
                </div>
              </CardContent>
            </Card>

            {/* Rules fired */}
            {data.rules.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="h-4 w-4" /> Rules Triggered ({data.rules.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.rules.map((rule) => (
                    <div key={rule.ruleId} className="border rounded-md p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{rule.ruleName}</span>
                        <Badge className={riskTierBadgeClass(rule.severity)} >{rule.severity}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{rule.explanation}</p>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Confidence: {(rule.confidence * 100).toFixed(0)}%</span>
                        <span>Exposure: {formatDollarsExact(rule.estimatedImproperAmount)}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* ML Score */}
            {data.mlScore != null && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Brain className="h-4 w-4" /> ML Anomaly Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold">{data.mlScore.toFixed(2)}</div>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, data.mlScore * 100)}%`,
                          backgroundColor: data.mlScore > 0.8 ? "var(--color-critical)" : data.mlScore > 0.5 ? "var(--color-high)" : "var(--color-medium)",
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Statistical anomaly detection — higher scores indicate greater deviation from expected patterns.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Detection lineage */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Detection Lineage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative pl-6 space-y-4">
                  <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border" />

                  <TimelineStep
                    label="Data Ingested"
                    detail={`${data.transaction.sourceSystem} transaction recorded on ${formatDate(data.transaction.disbursementDate)}`}
                  />
                  <TimelineStep
                    label="Unified View"
                    detail="Transaction merged into cross-system unified view"
                  />
                  {data.rules.length > 0 && (
                    <TimelineStep
                      label="Rules Engine"
                      detail={`${data.rules.length} rule(s) triggered: ${data.rules.map((r) => r.ruleName).join(", ")}`}
                      variant="warning"
                    />
                  )}
                  {data.mlScore != null && (
                    <TimelineStep
                      label="ML Scoring"
                      detail={`Anomaly score: ${data.mlScore.toFixed(2)}`}
                      variant="warning"
                    />
                  )}
                  <TimelineStep
                    label="Risk Assessment"
                    detail={`Tier: ${data.transaction.riskTier} | Score: ${data.transaction.riskScore.toFixed(1)} | Action: ${data.transaction.recommendedAction}`}
                    variant={data.transaction.riskTier === "CRITICAL" ? "error" : "warning"}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Related transactions */}
            {data.relatedTransactions.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Related Transactions ({data.relatedTransactions.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.relatedTransactions.slice(0, 10).map((rt) => (
                        <TableRow key={rt.transactionId}>
                          <TableCell className="font-mono text-xs">{rt.transactionId}</TableCell>
                          <TableCell>{rt.sourceSystem}</TableCell>
                          <TableCell className="text-right font-mono">{formatDollarsExact(rt.paymentAmount)}</TableCell>
                          <TableCell>{formatDate(rt.disbursementDate)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            <Button onClick={handleExport} variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" /> Export Audit Package (JSON)
            </Button>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function TimelineStep({ label, detail, variant = "default" }: { label: string; detail: string; variant?: "default" | "warning" | "error" }) {
  const dotColor = variant === "error" ? "bg-red-500" : variant === "warning" ? "bg-amber-500" : "bg-blue-500"
  return (
    <div className="relative">
      <div className={`absolute -left-[18px] top-1 h-2.5 w-2.5 rounded-full ${dotColor}`} />
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">{detail}</p>
    </div>
  )
}
