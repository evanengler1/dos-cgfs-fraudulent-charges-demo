# Talk Track: Strategic Positioning (Optional — Use If Needed)

Use this material as back-pocket context during the demo. Don't lead with it — let the demo speak for itself. Pull from these sections if CGI asks about their role, or if anyone asks "why not just Azure?"

---

## For CGI (SI Partner Value)

CGI's incentives are different from the end customer's. They care about delivery speed, margins, and repeatability.

**Key points to land:**

- **Faster delivery, better margins.** Snowflake collapses what would otherwise be a multi-month integration project (Azure Data Factory + Synapse + Azure ML + a custom app + a custom chatbot) into a single-platform build. Dynamic Tables replace hand-built ETL orchestration. Cortex ML replaces a separate Azure ML deployment. The Snowflake App replaces a standalone web app CGI would need to host and maintain. The Cortex Agent replaces a custom RAG/chatbot build. Every component CGI doesn't have to build from scratch is margin they keep.

- **Repeatable pattern.** If this works for CGFS, the same architecture (data unification → rules engine → ML anomaly detection → analyst app → conversational agent) applies to every federal financial system CGI touches — DoD, VA, Treasury, etc. Frame this as a template, not a one-off.

- **Domain expertise over plumbing.** CGI's value to DOS is their understanding of federal financial systems, not their ability to wire Spark jobs to a data lake. Snowflake lets CGI spend hours on fraud detection logic and domain rules — the high-value work — instead of infrastructure.

- **Managed services opportunity.** Post go-live, CGI can offer ongoing model tuning, rule refinement, new fraud pattern development, and dashboard evolution as managed services. They're updating SQL and React, not managing infrastructure.

**If you need a one-liner:**
> "We're giving you a platform where the cross-system correlation, the ML, the analyst app, and the conversational agent are all native — so your team spends time on CGFS domain logic, not on integration plumbing. And this becomes a pattern you take to every federal finance client."

---

## Why Snowflake on Azure, Not Azure-Only

DOS is an Azure shop. If someone asks "why not just Fabric/Synapse?" — the answer is "and, not or."

### The Comparison

| Capability | Azure-Only Path | Snowflake on Azure |
|---|---|---|
| **Cross-system unification** | ADF pipelines → Synapse/Fabric, maintain incremental merge logic | Dynamic Tables — declarative SQL, auto-incrementing, no orchestration code |
| **Rules engine** | Custom Spark/SQL jobs via ADF, manual dependency management | Dynamic Tables downstream of the unified view — rules are SQL, dependencies are automatic |
| **ML anomaly detection** | Azure ML workspace + Python + model serving endpoint + pipeline wiring | `ANOMALY_DETECTION` — one SQL statement, trains and scores in-place |
| **Interactive analyst app** | React + Azure App Service or Power Apps, separate auth and hosting | Snowflake App Runtime — `snow app deploy`, auth is Snowflake RBAC |
| **Conversational agent** | Azure OpenAI + RAG pipeline + embedding store + retrieval logic | Cortex Agent — Semantic View + verified queries, works out of the box |
| **Audit trail / governance** | Azure Purview + Synapse logs + custom lineage | Built-in: Access History, Object Dependencies, row-level lineage |
| **Time to value** | 6+ services to configure, connect, and maintain | One platform, one SQL dialect, one governance model |

### The "And Not Or" Framing
> "Your data lake stays on Azure. Your storage stays on Azure. Snowflake runs natively on Azure — it's not a migration off Azure, it's getting more from your Azure investment."

### What Azure Genuinely Can't Match Here
1. **Dynamic Tables** — No Azure equivalent of declarative, dependency-aware incremental materialized views. In Fabric you build and maintain pipelines manually.
2. **Cortex ML in SQL** — Azure ML needs a separate workspace, Python, model registry, and serving infra. Snowflake's `ANOMALY_DETECTION` is a SQL function.
3. **Cortex Agents with Semantic Views** — Azure OpenAI requires a custom RAG pipeline. Snowflake's agent uses a structured semantic layer with verified queries — more accurate, less hallucination risk.
4. **Single-platform governance** — One RBAC model, one audit log, one lineage graph. Azure requires stitching together Purview + Entra ID + per-service logs.

### Platform Consolidation (If You Want the Number)
Azure-only path = ADF + Synapse/Fabric + Azure ML + App Service + Azure OpenAI + Purview — six services, six auth models, six billing meters, integration glue between all of them. Snowflake on Azure = one platform on their Azure tenant, compliant with their Azure security posture.

### Moments in the Demo Where This Lands Naturally
You don't need to make these points explicitly. If the demo is running well, say them conversationally:

- **Data pipeline:** "These Dynamic Tables replace what would be 3-4 ADF pipelines and a set of Synapse stored procedures."
- **ML:** "We just trained an anomaly detection model with a SQL statement. No separate ML workspace."
- **App:** "This app is deployed inside Snowflake — same auth, same governance, same data."
- **Agent:** "That answer came from a Semantic View with verified queries — not a prompt-engineered chatbot hoping it gets the SQL right."
