"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { WaterfallChart } from "@/components/waterfall-chart"
import { CategoryExposureChart } from "@/components/category-exposure-chart"
import { CaseStudyFlow } from "@/components/case-study-flow"
import { formatDollars, formatNumber } from "@/lib/format"
import type { ImpactData } from "@/lib/types"
import { AlertTriangle, Shield, ArrowRight } from "lucide-react"

export const dynamic = "force-dynamic"

export default function ImpactPage() {
  const { data, isLoading } = useQuery<ImpactData>({
    queryKey: ["impact"],
    queryFn: () => fetch("/api/impact").then((r) => r.json()),
  })

  if (isLoading || !data) {
    return (
      <main className="w-full py-6 px-4 space-y-6">
        <div className="h-8 w-64 bg-muted rounded animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-64 bg-muted rounded animate-pulse" />
        ))}
      </main>
    )
  }

  const { waterfall, categoryExposures, totalPreventionSavings, caseStudies } = data

  return (
    <main className="w-full py-6 px-4 space-y-6">
      <div>
        <h1 className="text-xl font-bold">Financial Impact & Cross-System Detection</h1>
        <p className="text-sm text-muted-foreground">
          Quantifying improper payment exposure and demonstrating cross-system fraud detection
        </p>
      </div>

      {/* Waterfall */}
      <WaterfallChart waterfall={waterfall} />

      {/* Category exposure breakdown */}
      <CategoryExposureChart exposures={categoryExposures} />

      {/* Prevention calculator */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Prevention vs. Recovery Cost Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4">Category</th>
                  <th className="text-right py-2 px-4">Flagged Amount</th>
                  <th className="text-right py-2 px-4">Recovery Cost ($1.72/$1)</th>
                  <th className="text-right py-2 px-4">Recovery Rate</th>
                  <th className="text-right py-2 pl-4 font-semibold">Prevention Value</th>
                </tr>
              </thead>
              <tbody>
                {categoryExposures.map((cat) => (
                  <tr key={cat.category} className="border-b last:border-0">
                    <td className="py-2 pr-4">{cat.category.replace(/_/g, " ")}</td>
                    <td className="text-right py-2 px-4 font-mono">{formatDollars(cat.totalExposure)}</td>
                    <td className="text-right py-2 px-4 font-mono text-muted-foreground">{formatDollars(cat.recoveryCost)}</td>
                    <td className="text-right py-2 px-4 text-muted-foreground">&lt;50%</td>
                    <td className="text-right py-2 pl-4 font-mono font-semibold">{formatDollars(cat.preventionValue)}</td>
                  </tr>
                ))}
                <tr className="font-bold bg-muted/50">
                  <td className="py-2 pr-4">TOTAL</td>
                  <td className="text-right py-2 px-4 font-mono">
                    {formatDollars(categoryExposures.reduce((s, c) => s + c.totalExposure, 0))}
                  </td>
                  <td className="text-right py-2 px-4 font-mono">
                    {formatDollars(categoryExposures.reduce((s, c) => s + c.recoveryCost, 0))}
                  </td>
                  <td className="text-right py-2 px-4">&lt;50%</td>
                  <td className="text-right py-2 pl-4 font-mono">
                    {formatDollars(categoryExposures.reduce((s, c) => s + c.preventionValue, 0))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Virtual Merge callout */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
        <CardContent className="pt-4 pb-4 flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
              The existing Virtual Merge integration checks fund availability within a single system.
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
              Cross-boundary duplicates pass that check because funds exist in both GFMS and RFMS.
              Cross-system correlation in Snowflake catches what fund-availability checks miss.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Cross-system case studies */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Cross-System Detection Case Studies</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Real flagged transactions showing how cross-system correlation identifies fraud that single-system checks miss.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {caseStudies.map((cs) => (
            <CaseStudyFlow key={cs.id} caseStudy={cs} />
          ))}
        </div>
      </div>
    </main>
  )
}
