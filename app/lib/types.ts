export interface DashboardKPIs {
  totalTransactions: number
  totalFlagged: number
  totalExposure: number
  preventionSavings: number
  flagRate: number
}

export interface CategorySummary {
  category: string
  ruleName: string
  flagCount: number
  totalExposure: number
  avgAmount: number
  criticalCount: number
  highCount: number
}

export interface MonthlyTrend {
  month: string
  category: string
  flagCount: number
  totalExposure: number
}

export interface RiskTierDistribution {
  tier: string
  count: number
}

export interface DashboardData {
  kpis: DashboardKPIs
  categories: CategorySummary[]
  monthlyTrends: MonthlyTrend[]
  riskDistribution: RiskTierDistribution[]
}

export interface FlaggedTransaction {
  transactionId: string
  sourceSystem: string
  vendorId: string
  vendorName: string
  paymentAmount: number
  disbursementDate: string
  postId: string | null
  riskScore: number
  riskTier: string
  flags: string[]
  totalEstimatedLoss: number
  recommendedAction: string
  mlAnomalyScore: number | null
}

export interface TransactionListResponse {
  transactions: FlaggedTransaction[]
  total: number
  page: number
  pageSize: number
}

export interface RuleFlag {
  ruleId: string
  ruleName: string
  ruleCategory: string
  severity: string
  confidence: number
  estimatedImproperAmount: number
  explanation: string
  flaggedAt: string
}

export interface RelatedTransaction {
  transactionId: string
  sourceSystem: string
  vendorName: string
  paymentAmount: number
  disbursementDate: string
  description: string
}

export interface TransactionDetail {
  transaction: FlaggedTransaction
  rules: RuleFlag[]
  mlScore: number | null
  relatedTransactions: RelatedTransaction[]
}

export interface ImpactWaterfall {
  totalPayments: number
  totalPaymentAmount: number
  rulesCaught: number
  rulesCaughtAmount: number
  mlCaught: number
  mlCaughtAmount: number
  cleanTransactions: number
  cleanAmount: number
}

export interface CategoryExposure {
  category: string
  flagCount: number
  totalExposure: number
  recoveryCost: number
  preventionValue: number
}

export interface CaseStudy {
  id: string
  type: string
  title: string
  description: string
  amount: number
  systems: string[]
  steps: { system: string; detail: string }[]
}

export interface ImpactData {
  waterfall: ImpactWaterfall
  categoryExposures: CategoryExposure[]
  totalPreventionSavings: number
  caseStudies: CaseStudy[]
}
