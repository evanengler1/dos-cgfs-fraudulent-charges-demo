# Demo Approach: Improper Payment Prevention for CGFS
### Using GFMS, RFMS, GFACS, and gTA Data

**Prepared by:** Ryan Wright, Snowflake
**Context:** Follow-up to customer meeting — data lake on Azure + improper payments prevention use case
**Inspiration:** [Snowflake ML Credit Card Fraud Detection Guide](https://www.snowflake.com/en/developers/guides/credit-card-fraud-detection-using-snowflake-ml/)

---

## Background

CGFS owns and operates several core financial systems, per 1 FAM 610:

| System | Function |
|---|---|
| **GFMS** (Global Financial Management System) | Official domestic system of record — accounts for and controls appropriated resources, domestic disbursements |
| **RFMS** (Regional Financial Management System — RFMS/M, RFMS/D) | Global accounting and payment system for overseas posts (Momentum-based disbursing system) |
| **GFACS** (Global Foreign Affairs Compensation System — American + Locally Employed Staff) | Payroll / compensation system |
| **gTA** (Global Time and Attendance) | Time and attendance tracking |
| **COAST** (Consolidated Overseas Accountability Support Toolbox) | Overseas accountability and reconciliation layer |

Source: [Financial Management Systems Summary, State.gov](https://2009-2017.state.gov/s/d/rm/rls/perfrpt/2014/html/235104.htm), 1 FAM 610.

---

## The Opening Hook: "Virtual Merge"

State already runs a real-time integration between GFMS and RFMS — the "Virtual Merge" project — specifically to verify funding before a transaction processes:

> "If the RFMS obligation does not have sufficient funds or the accounting information does not match, the document will not process."

**This is the anchor for the pitch.** CGFS already believes in real-time pre-payment gating — they built one for fund availability. The ask is not to introduce a new concept, but to **extend a control they already trust** to catch far more than insufficient funds:

> "You already stop a payment in RFMS if it doesn't match GFMS funding. We're proposing the same real-time gate — but scoring for duplicate payments, ghost employees, debarred vendors, and behavioral anomalies, not just fund balance."

---

## Fraud / Improper Payment Signals by System

| System | Improper Payment Pattern to Detect |
|---|---|
| **GFMS** | Payments exceeding appropriated/obligated funds, duplicate domestic disbursements, vendor payments outside contract terms |
| **RFMS** | Overseas payment anomalies, duplicate post-level disbursements, payments against insufficient post-level obligations |
| **GFACS** | Ghost employees, pay outside grade/step, payments to separated employees, LE staff payroll anomalies |
| **gTA** | Hours claimed inconsistent with travel/leave status, time entries that don't reconcile with GFACS pay |

---

## Proposed Demo Architecture

```
GFMS (domestic)   ──┐
RFMS/M, RFMS/D   ────┼──► Snowflake unified transaction layer
GFACS (payroll)  ────┤     (Dynamic Tables joining across systems)
gTA (time)       ────┘
                           │
                           ▼
              Cross-system correlation + ML scoring
                           │
              ┌────────────┴─────────────┐
              ▼                          ▼
     Rules Engine (fast,         Anomaly Model (Cortex ML,
     deterministic)              catches what rules miss)
              │                          │
              └────────────┬─────────────┘
                            ▼
                   Risk score returned to
                   approval workflow —
                   before disbursement
```

**Key architectural point:** GFMS and RFMS are integrated today for *funds-checking* (Virtual Merge) — but not for *fraud or duplicate detection* across the domestic/overseas boundary. That gap is the wedge. Snowflake unifies both as a single dataset, enabling correlation neither system can do alone.

---

## Cross-System Correlation Examples (the differentiator)

These are the moments that land hardest in a demo, because no single system can see them in isolation:

1. **Ghost payment** — GFACS shows an employee separated/terminated → RFMS or GFMS still shows a payment processing to them.
2. **Time/pay mismatch** — gTA shows an employee on leave or travel → GFACS payroll shows a full-time domestic work claim for the same dates.
3. **Statistically abnormal but technically funded** — RFMS post-level disbursement is within the obligation passed down from GFMS (so Virtual Merge passes it) but is abnormal for that vendor/post/category.
4. **Cross-boundary duplicate/split payment** — Same vendor receiving payments through both GFMS (domestic) and RFMS (overseas) for what should be a single contract.

Point #4 is the strongest hook: **GFMS and RFMS are integrated for funds-checking, not fraud detection across the domestic/overseas boundary.**

---

## Suggested Demo Narrative

1. **Open with Virtual Merge** — demonstrate understanding of their environment. "You already do real-time fund verification between GFMS and RFMS. We're proposing the same real-time gate, extended to catch fraud patterns, not just insufficient funds."
2. **Show synthetic GFMS + RFMS + GFACS + gTA data unified in Snowflake** — a Dynamic Table joining all four sources.
3. **Rules-based catch** — ghost employee still receiving a GFACS payment after GFMS/RFMS shows a separation date.
4. **Cross-boundary catch** — same vendor paid via both GFMS and RFMS for overlapping goods/services (the gap Virtual Merge doesn't cover).
5. **ML anomaly catch** — a payment that passes every rule but is statistically abnormal (Cortex ML anomaly detection).
6. **The scoring gate** — show the "would this have been blocked before disbursement" moment, mapped explicitly to where Virtual Merge sits today.
7. **Audit trail close** — full lineage for IPERA reporting and OIG/GAO defensibility.

---

## Model Approach

**Tier 1 — Rules-based (deterministic, fast to build and demo)**
- Budget/obligation ceiling checks
- Duplicate detection (same amount, vendor/employee, period)
- Terminated employee still receiving GFACS or payment-system disbursement

**Tier 2 — ML anomaly detection (the differentiated layer)**
- Snowflake ML `ANOMALY_DETECTION`, trained on historical payment data
- Since labeled "this was fraud" data is unlikely to exist, favor **unsupervised anomaly detection** over the labeled classification approach used in the credit card tutorial — this is a more realistic fit for government payment data.
- State this explicitly in the demo: "Unlike commercial fraud data, you likely don't have labeled fraud examples — so we use anomaly detection to flag statistical outliers instead of training on known fraud."

---

## Synthetic Data to Build

Since real GFMS/RFMS extracts won't be available pre-sale, build synthetic tables modeled on their structure, with deliberate anomalies planted:

| Table (modeled on) | Key Fields |
|---|---|
| GFMS-style | obligation ID, appropriation/fund code, vendor ID, domestic payment amount, disbursement date |
| RFMS-style | post ID, obligation ID (linked to GFMS), overseas payment amount, disbursement date, vendor ID |
| GFACS-style | employee ID, pay period, gross pay, employment status, grade/step, American vs. LE staff flag |
| gTA-style | employee ID, date, hours claimed, leave/travel status code |

**Anomalies to plant:**
- A separated employee in GFACS-style data still appearing in a payment table
- A vendor ID appearing in both GFMS-style and RFMS-style tables for overlapping dates/services
- A gTA-style leave record overlapping a GFACS-style full-pay period

---

## Business Case Framing

- **IPERA (Improper Payments Elimination and Recovery Act)** reporting obligation — connects directly to a compliance requirement CGFS already has.
- Cost asymmetry: recovering an improper payment after the fact costs meaningfully more than preventing it (GAO estimates ~$1.72 recovery cost per $1.00 recovered), and recovery rates are often below 50%.
- Prevention eliminates both the financial loss and the downstream audit/reporting burden.

---

## Caution / Positioning Note

1 FAM 610 and the FY2014 Financial Management Systems Summary are useful for **credibility and structure** — but avoid presenting system architecture back to the customer as if we're the authority on their internal systems. Frame it as "we did some homework on how GFMS and RFMS work together" and let them correct or refine details live. That's often where the best discovery happens.

---

## Next Step

Build a working notebook skeleton with:
1. Synthetic data generation for GFMS/RFMS/GFACS/gTA-style tables
2. Dynamic Tables joining the four sources into a unified feature set
3. Rules-based checks (SQL)
4. Cortex ML anomaly detection model
5. Simple Streamlit reviewer dashboard showing a live risk score before "disbursement"

---

*Internal use — Snowflake Sales*
