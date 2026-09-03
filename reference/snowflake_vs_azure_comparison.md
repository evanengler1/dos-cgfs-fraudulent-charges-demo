# Snowflake on Azure vs. Azure-Only: CGFS Improper Payment Prevention

A direct capability comparison for this specific use case. Not a general platform comparison — scoped to what CGFS needs for cross-system fraud detection.

---

| Capability | What CGFS Needs | Azure-Only Path | Snowflake on Azure |
|---|---|---|---|
| **Cross-system data unification** | Join GFMS, RFMS, GFACS, and gTA into a single queryable layer that stays current | Build ADF pipelines to land each source into Synapse/Fabric. Write and maintain incremental merge/upsert logic. Schedule and monitor refreshes. | Dynamic Tables — declarative SQL definitions, automatic incremental refresh, built-in dependency tracking between tables. No orchestration code. |
| **Rules-based fraud detection** | Deterministic checks (ghost employees, duplicates, over-obligation) that run continuously as data updates | Custom Spark or SQL jobs scheduled via ADF. Manual dependency management between rules and source tables. | Additional Dynamic Tables downstream of the unified view. Rules are SQL. Dependencies resolve automatically. |
| **ML anomaly detection** | Unsupervised anomaly scoring for transactions that pass rules but are statistically unusual | Provision Azure ML workspace. Write Python training code. Register model. Deploy serving endpoint. Wire inference results back into the data pipeline. | `ANOMALY_DETECTION` — a SQL function. One statement to train, one to score. Runs in-place on the data, no separate infrastructure. |
| **Interactive analyst application** | React-based app for exploring flagged transactions, drilling into cases, quantifying financial impact | Build React app. Deploy to Azure App Service. Configure Entra ID for auth. Manage hosting, scaling, and SSL separately from the data layer. | Snowflake App Runtime — `snow app deploy`. Auth is Snowflake RBAC (same roles that govern data access). No separate hosting to manage. |
| **Conversational AI agent** | Natural-language Q&A over fraud data ("What's our total exposure?" "Which vendors are highest risk?") | Azure OpenAI + custom RAG pipeline: build embedding store, write retrieval logic, engineer prompts, manage chunking strategy, handle SQL generation and validation. | Cortex Agent with a Semantic View. Define entities/metrics/relationships in SQL. Add verified queries for high-value questions. Agent generates accurate SQL grounded in the semantic layer. |
| **Governance and audit trail** | Single audit view for IPERA reporting — who accessed what, how flags were generated, full detection lineage | Stitch together Azure Purview (catalog/lineage) + Synapse audit logs + Entra ID access logs + custom lineage for ML model provenance. Different log formats, different retention policies. | Built-in: Access History, Object Dependencies, query-level lineage — one audit surface covering data, ML, app, and agent. Same RBAC model end-to-end. |
| **Data residency** | Data must stay within their Azure environment | Native — data is in Azure. | Snowflake runs natively on Azure. Data stays in their Azure region. Compliant with their existing Azure security posture. |
| **Total services to operate** | Fewer moving parts = smaller attack surface, simpler FedRAMP boundary | ADF + Synapse/Fabric + Azure ML + App Service + Azure OpenAI + Purview — **6 services**, each with its own auth model, billing meter, and operational surface. | **1 platform** on their Azure tenant. One SQL dialect, one governance model, one billing relationship. |

---

## The Bottom Line

The Azure-only path works — it's all technically possible. The question is how many services CGI has to wire together, operate, and maintain versus how much of their time goes toward the actual fraud detection logic that protects CGFS.

| | Azure-Only | Snowflake on Azure |
|---|---|---|
| Services to provision and integrate | 6+ | 1 |
| Auth models to configure | 6 (Entra ID per-service) | 1 (Snowflake RBAC) |
| Languages required | SQL + Python + Spark + ARM/Bicep | SQL + React |
| ML deployment complexity | Workspace → train → register → deploy → serve → wire back | One SQL statement |
| Agent/chatbot build | Custom RAG pipeline | Semantic View + verified queries |
| Audit surface | Stitched across services | Single platform |

---

## Framing Note

This is not an "Azure is bad" conversation. The framing is:

> "Your data lake stays on Azure. Your storage stays on Azure. Snowflake runs natively on your Azure tenant — same region, same compliance boundary. It's not a migration off Azure. It's getting more from your Azure investment by consolidating the analytical, ML, app, and AI layers into one platform instead of six."
