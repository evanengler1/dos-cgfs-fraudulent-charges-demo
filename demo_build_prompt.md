# Prompt: Build End-to-End CGFS Improper Payment Prevention Demo in Snowflake

## Context

You are building a Snowflake demo for the U.S. Department of State's Bureau of the Comptroller and Global Financial Services (CGFS). CGFS operates four core financial systems: GFMS (domestic accounting/disbursements), RFMS (overseas accounting/payments), GFACS (payroll/compensation), and gTA (time and attendance). These systems are already partially integrated via a "Virtual Merge" that gates payments on fund availability — but no cross-system fraud or duplicate detection exists today. This demo shows how Snowflake closes that gap.

The demo has **two deliverables**:
1. A **React-based Snowflake App** (deployed via `snow app`) that lets users interactively explore flagged transactions, understand fraud patterns, and quantify financial impact.
2. A **Cortex Agent** (surfaced in Snowflake Intelligence / Cowork) that answers natural-language questions about improper payments, fraud trends, and dollar-value impact.

---

## Part 1: Synthetic Data Generation

Create a SQL script that generates synthetic data modeled on the four CGFS systems. All tables go in a dedicated database and schema (e.g., `CGFS_FRAUD_DEMO.RAW`).

### Tables to Create

**1. `RAW.GFMS_TRANSACTIONS`** (domestic disbursements)
| Column | Type | Description |
|---|---|---|
| TRANSACTION_ID | VARCHAR | Unique domestic payment ID |
| OBLIGATION_ID | VARCHAR | Links to the appropriation/obligation |
| APPROPRIATION_CODE | VARCHAR | Fund code (e.g., '19X0113') |
| VENDOR_ID | VARCHAR | Vendor receiving payment |
| VENDOR_NAME | VARCHAR | Vendor name |
| PAYMENT_AMOUNT | NUMBER(15,2) | Dollar amount |
| OBLIGATION_CEILING | NUMBER(15,2) | Max authorized for this obligation |
| DISBURSEMENT_DATE | DATE | When payment was made |
| DESCRIPTION | VARCHAR | Payment description / line item |
| CONTRACT_ID | VARCHAR | Associated contract, if any |
| BUREAU_CODE | VARCHAR | Requesting bureau |

**2. `RAW.RFMS_TRANSACTIONS`** (overseas disbursements)
| Column | Type | Description |
|---|---|---|
| TRANSACTION_ID | VARCHAR | Unique overseas payment ID |
| OBLIGATION_ID | VARCHAR | Links back to GFMS obligation |
| POST_ID | VARCHAR | Overseas post code (e.g., 'PARIS', 'NAIROBI') |
| VENDOR_ID | VARCHAR | Vendor receiving payment |
| VENDOR_NAME | VARCHAR | Vendor name |
| PAYMENT_AMOUNT | NUMBER(15,2) | Dollar amount |
| DISBURSEMENT_DATE | DATE | When payment was made |
| DESCRIPTION | VARCHAR | Payment description / line item |
| CONTRACT_ID | VARCHAR | Associated contract, if any |
| CURRENCY_CODE | VARCHAR | Original currency (payments converted to USD) |

**3. `RAW.GFACS_PAYROLL`** (employee compensation)
| Column | Type | Description |
|---|---|---|
| PAYROLL_ID | VARCHAR | Unique payroll record ID |
| EMPLOYEE_ID | VARCHAR | Employee identifier |
| EMPLOYEE_NAME | VARCHAR | Employee name |
| PAY_PERIOD_START | DATE | Start of pay period |
| PAY_PERIOD_END | DATE | End of pay period |
| GROSS_PAY | NUMBER(12,2) | Gross compensation |
| NET_PAY | NUMBER(12,2) | Net compensation |
| GRADE | VARCHAR | GS grade or LE equivalent |
| STEP | NUMBER | Step within grade |
| EMPLOYMENT_STATUS | VARCHAR | 'ACTIVE', 'SEPARATED', 'TERMINATED', 'ON_LEAVE' |
| SEPARATION_DATE | DATE | NULL if active, otherwise last day |
| STAFF_TYPE | VARCHAR | 'AMERICAN' or 'LE_STAFF' |
| POST_ID | VARCHAR | Post assignment |

**4. `RAW.GTA_TIME_ATTENDANCE`** (time and attendance)
| Column | Type | Description |
|---|---|---|
| RECORD_ID | VARCHAR | Unique time record |
| EMPLOYEE_ID | VARCHAR | Links to GFACS |
| RECORD_DATE | DATE | Date of the time entry |
| HOURS_CLAIMED | NUMBER(4,1) | Hours reported |
| STATUS_CODE | VARCHAR | 'REGULAR', 'ANNUAL_LEAVE', 'SICK_LEAVE', 'TRAVEL', 'LWOP', 'HOLIDAY' |
| POST_ID | VARCHAR | Post where hours were logged |

### Data Volume
- GFMS: ~50,000 transactions over 2 fiscal years (FY2024-FY2025)
- RFMS: ~40,000 transactions over the same period
- GFACS: ~120,000 payroll records (~2,500 employees x 24 pay periods x 2 years)
- gTA: ~500,000 time entries

### Deliberate Anomalies to Plant (Critical for Demo)

Plant at least **50-75 anomalies** across these categories, with varying dollar amounts to show range of impact:

| # | Anomaly Type | Category | What to Plant | Approx Count |
|---|---|---|---|---|
| 1 | **Ghost Employee Payments** | GFACS + GFMS/RFMS | Employees with SEPARATION_DATE in the past still receiving payroll disbursements in subsequent pay periods. Include 3-4 high-dollar cases ($80K-$150K cumulative) and several smaller ones. | 10-12 |
| 2 | **Cross-Boundary Duplicate Payments** | GFMS + RFMS | Same VENDOR_ID receiving payments through both GFMS (domestic) and RFMS (overseas) for overlapping dates, similar descriptions, and similar amounts — suggesting the same service was paid twice. This is the strongest demo hook because Virtual Merge cannot catch it. Include cases totaling $500K+. | 8-10 |
| 3 | **Over-Obligation Payments** | GFMS | Payment amounts that, when summed, exceed the OBLIGATION_CEILING. Some should be just barely over (hard to spot manually), others egregiously over. | 8-10 |
| 4 | **Time/Pay Mismatches** | gTA + GFACS | Employee on ANNUAL_LEAVE or TRAVEL in gTA for 2+ weeks, but GFACS shows full regular-hours pay for that period with no leave offset. | 8-10 |
| 5 | **Payments to Debarred/Flagged Vendors** | GFMS + RFMS | Create a small `RAW.DEBARRED_VENDORS` reference table (~20 vendors). Plant 5-6 payments to those vendors that slipped through. | 5-6 |
| 6 | **Statistical Outliers** | RFMS | Payments that pass all rules (funded, no duplicates, active vendor) but are 3-5x the typical amount for that post/vendor/category combination. These are the ML-catch cases. | 10-15 |
| 7 | **Split Payments** | GFMS or RFMS | A single large obligation split into multiple smaller payments just below a review threshold (e.g., several $9,500 payments against a $50K obligation when typical payments are $15K-$25K). | 5-8 |

Also create a summary reference table:

**5. `RAW.DEBARRED_VENDORS`**
| Column | Type |
|---|---|
| VENDOR_ID | VARCHAR |
| VENDOR_NAME | VARCHAR |
| DEBARMENT_DATE | DATE |
| REASON | VARCHAR |

### Important Data Realism Notes
- Vendor names should sound plausible (consulting firms, logistics companies, construction firms, IT services).
- Post IDs should be real embassy cities (Paris, Nairobi, London, Tokyo, Mexico City, Baghdad, Kabul, etc.).
- Appropriation codes should follow the federal format (XX-XXXX/XXXX, e.g., '19-0113/0117').
- Payment amounts should have realistic distributions — most in the $1K-$50K range, some large contracts $100K-$500K.
- Employee names should be synthetic but plausible. Mix of American and LE staff.
- Time entries should reflect realistic government work patterns (8hr days, standard leave patterns).

---

## Part 2: Data Pipeline — Dynamic Tables, Rules Engine, and ML Scoring

Build the analytical layer in `CGFS_FRAUD_DEMO.ANALYTICS`.

### 2a. Unified Transaction View (Dynamic Table)

Create a Dynamic Table `ANALYTICS.UNIFIED_TRANSACTIONS` that joins GFMS and RFMS transactions into a single view with a `SOURCE_SYSTEM` column ('GFMS' or 'RFMS'). Include the obligation ceiling from GFMS for RFMS transactions that share the same OBLIGATION_ID.

### 2b. Rules-Based Detection (Dynamic Table)

Create `ANALYTICS.RULES_ENGINE_FLAGS` as a Dynamic Table that applies deterministic rules and produces one row per flagged transaction. Each row should include:

- `TRANSACTION_ID`
- `RULE_ID` (e.g., 'RULE_001')
- `RULE_NAME` (e.g., 'Ghost Employee Payment')
- `RULE_CATEGORY` (e.g., 'PAYROLL_FRAUD', 'DUPLICATE_PAYMENT', 'OBLIGATION_BREACH', 'VENDOR_RISK', 'TIME_PAY_MISMATCH')
- `SEVERITY` ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')
- `CONFIDENCE` (0-1 score based on how clearly the rule was violated)
- `ESTIMATED_IMPROPER_AMOUNT` — the dollar value at risk
- `EXPLANATION` — human-readable description of why this was flagged
- `FLAGGED_AT` — timestamp

Rules to implement:
1. **Ghost Employee** — Join GFACS (separated employees) to payment tables; flag any payment after separation date.
2. **Cross-Boundary Duplicate** — Join GFMS and RFMS on VENDOR_ID + overlapping date windows + similar amounts (within 10%); flag potential duplicates.
3. **Over-Obligation** — Running sum of payments per OBLIGATION_ID vs. OBLIGATION_CEILING; flag when cumulative exceeds ceiling.
4. **Time/Pay Mismatch** — Join gTA leave records to GFACS pay periods; flag full-pay periods where leave exceeds 50% of the period.
5. **Debarred Vendor** — Join payment tables to DEBARRED_VENDORS; flag any match.
6. **Split Payment Pattern** — Within an obligation, detect clusters of payments just below common thresholds ($10K, $25K) that sum to a large total.

### 2c. ML Anomaly Scoring

Use Snowflake Cortex ML `ANOMALY_DETECTION` to score transactions that pass the rules engine. Train on the unified transaction view using features like:
- Payment amount (normalized by post/vendor/category)
- Days since last payment to this vendor
- Payment frequency deviation from historical baseline
- Ratio of payment to obligation ceiling

Create `ANALYTICS.ML_ANOMALY_FLAGS` with anomaly scores and a flag for scores above the detection threshold.

### 2d. Combined Risk Score View

Create `ANALYTICS.FRAUD_RISK_SUMMARY` that combines rules-based flags and ML anomaly flags into a single risk profile per transaction:
- `TRANSACTION_ID`
- `SOURCE_SYSTEM`
- `VENDOR_ID` / `EMPLOYEE_ID`
- `PAYMENT_AMOUNT`
- `RISK_SCORE` (0-100, composite of rules severity + ML anomaly score)
- `RISK_TIER` ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')
- `FLAGS` (ARRAY of all triggered rules/anomalies)
- `TOTAL_ESTIMATED_LOSS` (sum of estimated improper amounts for this entity)
- `RECOMMENDED_ACTION` ('BLOCK', 'REVIEW', 'MONITOR', 'PASS')

Also create aggregate summary tables for the app and agent:

**`ANALYTICS.FRAUD_SUMMARY_BY_CATEGORY`** — total count, total dollar exposure, avg amount by fraud category.

**`ANALYTICS.FRAUD_SUMMARY_BY_POST`** — flagged transaction count and dollar exposure by overseas post.

**`ANALYTICS.FRAUD_SUMMARY_BY_VENDOR`** — vendors with the most flags, total exposure, number of systems they appear in.

**`ANALYTICS.FRAUD_TREND_MONTHLY`** — monthly time series of flagged transactions and dollar amounts, by category.

---

## Part 3: React-Based Snowflake App (Snowflake App Runtime)

Build a React/Next.js application deployed as a Snowflake App via `snow app`. This is the interactive exploration tool for fraud analysts.

### App Structure and Pages

**Page 1: Executive Dashboard**
- Top-level KPI cards: Total Transactions Analyzed, Total Flagged, Total Dollar Exposure, Prevention Rate (flagged before disbursement)
- Highlight the cost asymmetry: show a callout that says "Recovering improper payments costs ~$1.72 per $1.00 recovered (GAO). Prevention eliminates both the loss and the recovery cost." Calculate the avoided recovery cost based on flagged amounts.
- Bar chart: Flagged transactions by category (Ghost Employee, Cross-Boundary Duplicate, Over-Obligation, etc.)
- Line chart: Monthly trend of flagged amounts over FY2024-FY2025
- Pie/donut chart: Distribution of risk tiers (Critical/High/Medium/Low)

**Page 2: Transaction Explorer**
- Filterable, sortable table of all flagged transactions
- Filters: Risk Tier, Category, Source System (GFMS/RFMS), Post, Date Range, Amount Range
- Clicking a row opens a detail panel showing:
  - Full transaction details
  - All triggered rules with explanations
  - ML anomaly score and contributing features
  - Related transactions (e.g., the matching duplicate, the separation record, the leave overlap)
  - Timeline view of the entity's transaction history

**Page 3: Cross-System Correlation View**
- This is the "wow" page. Visually show the cross-system connections that caught the fraud:
  - A network/graph visualization showing how a flagged entity connects across GFMS, RFMS, GFACS, and gTA
  - Example: Employee X → separated in GFACS on 2024-06-15 → payment of $12,400 in RFMS on 2024-08-01 → flagged as Ghost Employee
  - Example: Vendor Y → $45,000 in GFMS on 2024-03-10 → $43,200 in RFMS on 2024-03-12 → flagged as Cross-Boundary Duplicate
- Include a "Virtual Merge Comparison" callout: "Virtual Merge checks fund availability. This transaction had sufficient funds and would have passed. Cross-system fraud detection caught it."

**Page 4: Financial Impact Analysis**
- Waterfall chart showing: Total Payments → Rules-Caught → ML-Caught → Remaining Clean
- Breakdown of dollar exposure by category with cumulative impact
- "Prevention vs. Recovery" calculator: Shows for each flagged category the cost of prevention (Snowflake compute) vs. the cost of after-the-fact recovery (GAO $1.72/$1.00 ratio + <50% recovery rate)
- Projected annual savings extrapolation

**Page 5: Audit Trail**
- For any flagged transaction, show the complete detection lineage: which data sources contributed, which rules fired, when the flag was raised, what the recommended action was
- Designed to support IPERA (Improper Payments Elimination and Recovery Act) reporting requirements
- Export capability for OIG/GAO audit packages

### Technical Requirements
- Use the Snowflake App Runtime (Next.js-based, deployed via `snow app deploy`)
- Connect to the `CGFS_FRAUD_DEMO` database and query the `ANALYTICS` schema views/tables
- Use a clean, professional UI — government audience, so prioritize clarity and data density over visual flair
- Color scheme: Use red/amber/green for risk tiers. Keep the overall palette neutral and professional.
- All dollar amounts formatted with $ and commas. All dates in MM/DD/YYYY format.
- Responsive layout but optimized for desktop (analysts will use this on monitors, not phones)

---

## Part 4: Cortex Agent for Snowflake Intelligence (Cowork)

Build a Cortex Agent that analysts can query in natural language through Snowflake Intelligence (Cowork).

### 4a. Semantic View

Create a Semantic View over the analytics tables that defines:

**Entities:**
- `flagged_transactions` (from `ANALYTICS.FRAUD_RISK_SUMMARY`) — the core fact table
- `fraud_by_category` (from `ANALYTICS.FRAUD_SUMMARY_BY_CATEGORY`)
- `fraud_by_post` (from `ANALYTICS.FRAUD_SUMMARY_BY_POST`)
- `fraud_by_vendor` (from `ANALYTICS.FRAUD_SUMMARY_BY_VENDOR`)
- `fraud_trend` (from `ANALYTICS.FRAUD_TREND_MONTHLY`)
- `unified_transactions` (from `ANALYTICS.UNIFIED_TRANSACTIONS`) — for context on clean transactions too

**Key Metrics to Define:**
- `total_flagged_amount` — sum of ESTIMATED_IMPROPER_AMOUNT across all flags
- `total_flagged_transactions` — count of distinct flagged transaction IDs
- `prevention_savings` — total_flagged_amount * 1.72 (the avoided recovery cost)
- `avg_risk_score` — average RISK_SCORE
- `critical_flags_count` — count where RISK_TIER = 'CRITICAL'
- `ghost_employee_exposure` — total dollar exposure from ghost employee flags specifically
- `cross_boundary_duplicate_exposure` — total from cross-boundary duplicates
- `flag_rate` — flagged transactions / total transactions

**Dimensions:**
- `fraud_category`, `risk_tier`, `source_system`, `post_id`, `vendor_id`, `employee_id`, `month`, `fiscal_year`

**Relationships:**
- Define joins between the summary tables and the detail table so the agent can drill down.

### 4b. Verified Query Repository (VQRs)

Include verified queries for common high-value questions:

1. "What is the total dollar exposure from fraudulent charges?" — Returns total ESTIMATED_IMPROPER_AMOUNT with breakdown by category.
2. "Which vendors have the highest fraud risk?" — Top 10 vendors by total flagged amount, with flag count and categories.
3. "How much have we prevented in improper payments?" — Total flagged amount + the $1.72/dollar recovery cost avoided.
4. "What are the most common types of fraud?" — Count and dollar amount by RULE_CATEGORY, sorted by exposure.
5. "Show me ghost employee payments" — All flags where category is GHOST_EMPLOYEE, with employee details and amounts.
6. "Which overseas posts have the most flagged transactions?" — Breakdown by POST_ID with amounts and flag categories.
7. "What is the monthly trend in detected fraud?" — Time series of flagged amounts and counts by month.
8. "Show me cross-boundary duplicate payments" — The cross-system catches that Virtual Merge misses. Include both the GFMS and RFMS sides of each duplicate.
9. "What would it cost to recover these improper payments after the fact?" — Apply the GAO $1.72/$1.00 ratio and <50% recovery rate to show the value of prevention.
10. "What is the highest single improper payment detected?" — The largest individual flagged transaction with full context.

### 4c. Agent Configuration

Create the Cortex Agent with:
- A clear system prompt that positions it as an improper payment prevention analyst for CGFS
- Instruction to always frame answers in terms of financial impact and prevention value
- Instruction to reference the Virtual Merge context when discussing cross-boundary duplicates (i.e., "This type of fraud passes the existing fund-availability check because the obligation has sufficient funds — it requires cross-system correlation to detect")
- Instruction to cite specific dollar amounts and transaction counts in every answer
- The Semantic View as its data source

### 4d. Key Agent Behaviors to Demonstrate

The agent should handle these conversation flows well:

- **Impact quantification**: "How much money are we at risk of losing?" → Clear dollar figure with breakdown
- **Pattern explanation**: "Why was this vendor flagged?" → Walks through the specific rules/anomalies that triggered
- **Comparison**: "How does fraud at our European posts compare to African posts?" → Geographic breakdown with context
- **Prevention value**: "What's the ROI of this system?" → Prevention savings vs. compute cost, referencing GAO recovery cost data
- **Drill-down**: "Tell me more about the ghost employee cases" → Specific cases, amounts, how long payments continued after separation
- **Trend analysis**: "Is fraud getting worse or better?" → Monthly trend with commentary

---

## Execution Order

1. Run the synthetic data generation script first. Verify table counts and spot-check that anomalies are present.
2. Build the Dynamic Tables and rules engine. Verify that planted anomalies are caught and flag counts match expectations.
3. Run the ML anomaly detection. Verify it catches the statistical outliers that rules miss.
4. Build and verify the summary/aggregate tables.
5. Create the Semantic View and verify it compiles. Test a few queries manually.
6. Create the Cortex Agent and test the VQR questions.
7. Build the React app, connecting to the analytics tables. Test all five pages.
8. Deploy the app via `snow app deploy`.

---

## Important Notes

- **All data is synthetic.** No real CGFS data is used. Make this clear in the app UI (e.g., a banner: "Demo Environment — Synthetic Data").
- **Dollar amounts matter.** The demo lands when the audience sees specific, large dollar figures that would have been lost. Plant anomalies with enough aggregate exposure that the total is in the millions — that's what gets attention in a government budget context.
- **The cross-boundary duplicate is the hero moment.** This is the fraud type that their existing Virtual Merge integration cannot catch because it only checks fund availability within a single system. Emphasize this in the app, the agent, and the narrative.
- **IPERA compliance** is a real regulatory requirement for CGFS. The audit trail page in the app should feel like it was designed for an auditor, not just an analyst.
- **Unsupervised anomaly detection** is the right ML approach here. Government agencies rarely have labeled fraud datasets. Frame the ML tier as "catches what rules miss" — the statistically unusual but technically compliant transactions.
