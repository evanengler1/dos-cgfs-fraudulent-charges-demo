"use client"

import { Card, CardContent } from "@/components/ui/card"

interface KPICardProps {
  label: string
  value: string
  subtitle?: string
}

export function KPICard({ label, value, subtitle }: KPICardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}
