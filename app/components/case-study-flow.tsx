"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDollarsExact } from "@/lib/format"
import type { CaseStudy } from "@/lib/types"
import { ArrowDown } from "lucide-react"

const SYSTEM_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  GFMS: { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-blue-800" },
  RFMS: { bg: "bg-green-50 dark:bg-green-950/30", text: "text-green-700 dark:text-green-300", border: "border-green-200 dark:border-green-800" },
  GFACS: { bg: "bg-orange-50 dark:bg-orange-950/30", text: "text-orange-700 dark:text-orange-300", border: "border-orange-200 dark:border-orange-800" },
  gTA: { bg: "bg-purple-50 dark:bg-purple-950/30", text: "text-purple-700 dark:text-purple-300", border: "border-purple-200 dark:border-purple-800" },
  DETECTION: { bg: "bg-red-50 dark:bg-red-950/30", text: "text-red-700 dark:text-red-300", border: "border-red-200 dark:border-red-800" },
}

export function CaseStudyFlow({ caseStudy }: { caseStudy: CaseStudy }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{caseStudy.title}</CardTitle>
        <p className="text-xs text-muted-foreground">{caseStudy.id}</p>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 mb-3">
          {caseStudy.systems.map((sys) => (
            <Badge key={sys} variant="outline" className="text-xs">
              {sys}
            </Badge>
          ))}
          <span className="ml-auto font-mono font-semibold text-sm">
            {formatDollarsExact(caseStudy.amount)}
          </span>
        </div>

        <div className="space-y-1">
          {caseStudy.steps.map((step, i) => {
            const colors = SYSTEM_COLORS[step.system] ?? SYSTEM_COLORS.DETECTION
            return (
              <div key={i}>
                {i > 0 && (
                  <div className="flex justify-center py-0.5">
                    <ArrowDown className="h-3 w-3 text-muted-foreground" />
                  </div>
                )}
                <div className={`rounded-md border p-2 ${colors.bg} ${colors.border}`}>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs ${colors.text} border-current`}>
                      {step.system}
                    </Badge>
                  </div>
                  <p className={`text-xs mt-1 ${colors.text}`}>{step.detail}</p>
                </div>
              </div>
            )
          })}
        </div>

        <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">{caseStudy.description}</p>
      </CardContent>
    </Card>
  )
}
