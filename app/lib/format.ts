export function formatDollars(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDollarsExact(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "N/A"
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return `${String(d.getUTCMonth() + 1).padStart(2, "0")}/${String(d.getUTCDate()).padStart(2, "0")}/${d.getUTCFullYear()}`
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n)
}

export function formatPercent(n: number): string {
  return `${(n * 100).toFixed(1)}%`
}

export function riskTierColor(tier: string): string {
  switch (tier) {
    case "CRITICAL": return "var(--color-critical)"
    case "HIGH": return "var(--color-high)"
    case "MEDIUM": return "var(--color-medium)"
    case "LOW": return "var(--color-low)"
    default: return "var(--muted-foreground)"
  }
}

export function riskTierBadgeClass(tier: string): string {
  switch (tier) {
    case "CRITICAL": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
    case "HIGH": return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
    case "MEDIUM": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
    case "LOW": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
    default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
  }
}

export function toIso(val: unknown): string | null {
  if (!val) return null
  if (val instanceof Date) return val.toISOString()
  return String(val)
}
