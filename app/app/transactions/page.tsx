"use client"

import { useState, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TransactionDetailSheet } from "@/components/transaction-detail"
import { formatDollarsExact, formatDate, riskTierBadgeClass } from "@/lib/format"
import type { TransactionListResponse } from "@/lib/types"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

export const dynamic = "force-dynamic"

const RISK_TIERS = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
const CATEGORIES = ["PAYROLL_FRAUD", "DUPLICATE_PAYMENT", "OBLIGATION_BREACH", "TIME_PAY_MISMATCH", "VENDOR_RISK", "SPLIT_PAYMENT"]
const SOURCES = ["GFMS", "RFMS"]

const CATEGORY_LABELS: Record<string, string> = {
  PAYROLL_FRAUD: "Ghost Employee",
  DUPLICATE_PAYMENT: "Cross-Boundary Duplicate",
  OBLIGATION_BREACH: "Over-Obligation",
  TIME_PAY_MISMATCH: "Time/Pay Mismatch",
  VENDOR_RISK: "Debarred Vendor",
  SPLIT_PAYMENT: "Split Payment",
}

export default function TransactionsPage() {
  const [filters, setFilters] = useState({
    tier: "",
    category: "",
    source: "",
    post: "",
    dateFrom: "",
    dateTo: "",
    amountMin: "",
    amountMax: "",
  })
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const pageSize = 25

  const queryString = useCallback(() => {
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("limit", String(pageSize))
    if (filters.tier) params.set("tier", filters.tier)
    if (filters.category) params.set("category", filters.category)
    if (filters.source) params.set("source", filters.source)
    if (filters.post) params.set("post", filters.post)
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom)
    if (filters.dateTo) params.set("dateTo", filters.dateTo)
    if (filters.amountMin) params.set("amountMin", filters.amountMin)
    if (filters.amountMax) params.set("amountMax", filters.amountMax)
    return params.toString()
  }, [page, filters])

  const { data, isLoading } = useQuery<TransactionListResponse>({
    queryKey: ["transactions", page, filters],
    queryFn: () => fetch(`/api/transactions?${queryString()}`).then((r) => r.json()),
  })

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0

  function updateFilter(key: string, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  function clearFilters() {
    setFilters({ tier: "", category: "", source: "", post: "", dateFrom: "", dateTo: "", amountMin: "", amountMax: "" })
    setPage(1)
  }

  const hasFilters = Object.values(filters).some(Boolean)

  return (
    <main className="w-full py-6 px-4 space-y-4">
      <div>
        <h1 className="text-xl font-bold">Transaction Explorer</h1>
        <p className="text-sm text-muted-foreground">
          {data ? `${data.total.toLocaleString()} flagged transactions` : "Loading..."} — click any row for full audit detail
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Filters</CardTitle>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-3 w-3 mr-1" /> Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Select value={filters.tier} onValueChange={(v) => updateFilter("tier", v === "ALL" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Risk Tier" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Tiers</SelectItem>
                {RISK_TIERS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filters.category} onValueChange={(v) => updateFilter("category", v === "ALL" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{CATEGORY_LABELS[c] ?? c}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filters.source} onValueChange={(v) => updateFilter("source", v === "ALL" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Source System" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Systems</SelectItem>
                {SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>

            <Input
              placeholder="Post ID"
              value={filters.post}
              onChange={(e) => updateFilter("post", e.target.value)}
            />

            <Input
              type="date"
              placeholder="From date"
              value={filters.dateFrom}
              onChange={(e) => updateFilter("dateFrom", e.target.value)}
            />
            <Input
              type="date"
              placeholder="To date"
              value={filters.dateTo}
              onChange={(e) => updateFilter("dateTo", e.target.value)}
            />
            <Input
              type="number"
              placeholder="Min amount"
              value={filters.amountMin}
              onChange={(e) => updateFilter("amountMin", e.target.value)}
            />
            <Input
              type="number"
              placeholder="Max amount"
              value={filters.amountMax}
              onChange={(e) => updateFilter("amountMax", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Risk Tier</TableHead>
                  <TableHead className="text-right">Risk Score</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-muted rounded animate-pulse" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : data?.transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No transactions match the current filters
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.transactions.map((tx) => (
                    <TableRow
                      key={tx.transactionId}
                      className="cursor-pointer hover:bg-accent/50"
                      onClick={() => setSelectedId(tx.transactionId)}
                    >
                      <TableCell className="font-mono text-xs">{tx.transactionId}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{tx.sourceSystem}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{tx.vendorName}</TableCell>
                      <TableCell className="text-right font-mono">{formatDollarsExact(tx.paymentAmount)}</TableCell>
                      <TableCell>{formatDate(tx.disbursementDate)}</TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${riskTierBadgeClass(tx.riskTier)}`}>
                          {tx.riskTier}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{tx.riskScore.toFixed(1)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{tx.recommendedAction}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} ({data?.total.toLocaleString()} results)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <TransactionDetailSheet
        transactionId={selectedId}
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
      />
    </main>
  )
}
