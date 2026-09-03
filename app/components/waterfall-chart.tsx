"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDollars } from "@/lib/format"
import type { ImpactWaterfall } from "@/lib/types"

export function WaterfallChart({ waterfall }: { waterfall: ImpactWaterfall }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Payment Analysis Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center text-sm">
          <div className="border rounded-lg p-4">
            <p className="text-muted-foreground">Total Payments</p>
            <p className="font-bold text-2xl mt-1">{formatDollars(waterfall.totalPaymentAmount)}</p>
            <p className="text-xs text-muted-foreground mt-1">{waterfall.totalPayments.toLocaleString()} transactions</p>
          </div>
          <div className="border rounded-lg p-4 border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20">
            <p className="text-muted-foreground">Rules-Caught</p>
            <p className="font-bold text-2xl mt-1 text-red-600 dark:text-red-400">{formatDollars(waterfall.rulesCaughtAmount)}</p>
            <p className="text-xs text-muted-foreground mt-1">{waterfall.rulesCaught.toLocaleString()} flagged</p>
          </div>
          <div className="border rounded-lg p-4 border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20">
            <p className="text-muted-foreground">ML-Caught</p>
            <p className="font-bold text-2xl mt-1 text-orange-600 dark:text-orange-400">{formatDollars(waterfall.mlCaughtAmount)}</p>
            <p className="text-xs text-muted-foreground mt-1">{waterfall.mlCaught.toLocaleString()} flagged</p>
          </div>
          <div className="border rounded-lg p-4 border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
            <p className="text-muted-foreground">Remaining Clean</p>
            <p className="font-bold text-2xl mt-1 text-green-600 dark:text-green-400">{formatDollars(waterfall.cleanAmount)}</p>
            <p className="text-xs text-muted-foreground mt-1">{waterfall.cleanTransactions.toLocaleString()} transactions</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
