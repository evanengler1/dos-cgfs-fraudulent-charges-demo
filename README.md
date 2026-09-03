# DOS CGFS Fraudulent Charges Demo

Improper payment prevention demo for the U.S. Department of State's Bureau of the Comptroller and Global Financial Services (CGFS). Built on Snowflake with synthetic data, a rules engine + ML anomaly detection pipeline, a Cortex Agent for natural language queries, and a React/Next.js app deployed as a Snowflake App.

**All data is synthetic** — generated for demonstration purposes only.

## Architecture

```
RAW (5 tables, ~1.5M rows)
  ├─ GFMS_TRANSACTIONS       Overseas financial transactions
  ├─ RFMS_TRANSACTIONS       Domestic financial transactions
  ├─ PERSONNEL_RECORDS       Employee records across posts
  ├─ VENDOR_MASTER           Vendor registry
  └─ PAYROLL_RECORDS          Payroll disbursements

ANALYTICS (Dynamic Tables + ML)
  ├─ UNIFIED_TRANSACTIONS     Merged GFMS + RFMS (DT)
  ├─ RULES_ENGINE_FLAGS       6 rule categories (DT)
  ├─ ML_ANOMALY_FLAGS         Z-score statistical outliers
  ├─ FRAUD_RISK_SUMMARY       Combined risk scoring
  └─ 4 summary tables         By category, vendor, post, month

Semantic View: CGFS_FRAUD_SV (5 entities, 14 dims, 12 facts, 6 metrics, 10 VQRs)
Cortex Agent: CGFS_FRAUD_AGENT (Snowflake Intelligence)
App: CGFS_FRAUD_APP (React/Next.js on Snowflake App Runtime)
```

## Fraud Categories

| Category | Description |
|----------|-------------|
| Ghost Employee | Payments to employees with no corresponding personnel record |
| Cross-Boundary Duplicate | Same vendor paid through both GFMS and RFMS (bypasses Virtual Merge) |
| Vendor Anomaly | Vendors with abnormally high transaction volume or amounts |
| Temporal Anomaly | Transactions on weekends, holidays, or outside business hours |
| Round Amount Structuring | Suspiciously round dollar amounts suggesting manual fabrication |
| Time/Pay Mismatch | Hours worked vs. pay disbursed discrepancies |
| Statistical Outlier | ML-flagged transactions deviating >2 standard deviations from post norms |

## Setup

### Prerequisites

- Snowflake account with ACCOUNTADMIN access
- [Snowflake CLI](https://docs.snowflake.com/en/developer-guide/snowflake-cli/index) (`snow`) installed
- Node.js 18+

### Backend (SQL)

Run the SQL scripts in order from `sql/`:

```bash
# 1. Create role, warehouse, database, schemas
snow sql -f sql/01_provision.sql

# 2. Generate synthetic data (~1.5M rows)
snow sql -f sql/02_synthetic_data.sql

# 3-5. Build analytics pipeline
snow sql -f sql/03_analytics_pipeline.sql
snow sql -f sql/04_ml_anomaly.sql
snow sql -f sql/05_summary_tables.sql

# 6-7. Create Semantic View and Cortex Agent
snow sql -f sql/06_semantic_view.sql
snow sql -f sql/07_cortex_agent.sql
```

### App

```bash
cd app

# Local development
npm install
SNOWFLAKE_CONNECTION_NAME=<your-connection> npm run dev

# Deploy to Snowflake
snow app deploy --connection <your-connection> --verbose
```

See `app/README.md` for page descriptions and data source details.

### Teardown

```bash
snow sql -f sql/99_teardown.sql
```

## Project Structure

```
├── sql/
│   ├── 01_provision.sql          Role, warehouse, database setup
│   ├── 02_synthetic_data.sql     Synthetic data generation
│   ├── 03_analytics_pipeline.sql Dynamic Tables (unified + rules engine)
│   ├── 04_ml_anomaly.sql         Statistical anomaly detection
│   ├── 05_summary_tables.sql     Risk summary + aggregates
│   ├── 06_semantic_view.sql      Semantic View definition
│   ├── 07_cortex_agent.sql       Cortex Agent definition
│   ├── 08_data_exploration.sql   Interactive demo walkthrough queries
│   └── 99_teardown.sql           Complete cleanup
├── app/                          React/Next.js Snowflake App
├── reference/                    Demo approach docs and talk track
└── demo_build_prompt.md          Original build specification
```
