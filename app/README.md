# CGFS Improper Payment Prevention

Cross-system fraud detection and financial impact analysis for the U.S. Department of State's Bureau of the Comptroller and Global Financial Services (CGFS). This React/Next.js application is deployed as a Snowflake App via `snow app deploy`.

## Pages

1. **Executive Dashboard** — KPI cards (transactions analyzed, flagged, dollar exposure, prevention savings), fraud category breakdown, monthly trend chart, and risk tier distribution.
2. **Transaction Explorer** — Filterable, sortable table of all 863 flagged transactions. Click any row for a slide-out detail panel showing triggered rules, ML anomaly scores, detection lineage timeline, related transactions, and JSON audit export.
3. **Financial Impact & Cross-System Detection** — Payment waterfall breakdown, category exposure chart, prevention vs. recovery cost calculator (GAO $1.72/$1 ratio), and cross-system case study flow diagrams demonstrating Ghost Employee, Cross-Boundary Duplicate, and Time/Pay Mismatch detection.

## Data Sources

All queries target `CGFS_FRAUD_DEMO.ANALYTICS`:

| Table | Rows | Purpose |
|-------|------|---------|
| `FRAUD_RISK_SUMMARY` | 863 | Core flagged transactions |
| `FRAUD_SUMMARY_BY_CATEGORY` | 6 | Aggregate by fraud type |
| `FRAUD_SUMMARY_BY_POST` | 31 | Aggregate by overseas post |
| `FRAUD_SUMMARY_BY_VENDOR` | 108 | Aggregate by vendor |
| `FRAUD_TREND_MONTHLY` | 52 | Monthly time series |
| `RULES_ENGINE_FLAGS` | 237 | Rule-based detections |
| `ML_ANOMALY_FLAGS` | 686 | ML-scored anomalies |
| `UNIFIED_TRANSACTIONS` | 89,175 | All GFMS + RFMS transactions |

## Local Development

```bash
npm install
SNOWFLAKE_CONNECTION_NAME=sfsenorthamerica-eengler_aws1 npm run dev
```

Or set the connection in `.env.local`:
```
SNOWFLAKE_CONNECTION_NAME=sfsenorthamerica-eengler_aws1
```

## Deploy

```bash
snow app deploy --connection sfsenorthamerica-eengler_aws1 --verbose
```
