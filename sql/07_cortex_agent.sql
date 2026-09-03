-- 07_cortex_agent.sql: Cortex Agent for Snowflake Intelligence
-- Run as CGFS_DEMO_ROLE after 06_semantic_view.sql.
-- Note: CREATE AGENT privilege must be granted first (see 01_provision.sql).

USE ROLE CGFS_DEMO_ROLE;
USE WAREHOUSE CGFS_DEMO_WH;
USE DATABASE CGFS_FRAUD_DEMO;

CREATE OR REPLACE AGENT ANALYTICS.CGFS_FRAUD_AGENT
  COMMENT = 'Improper Payment Prevention Analyst for CGFS'
  PROFILE = '{"display_name": "CGFS Fraud Prevention Analyst", "color": "red"}'
  FROM SPECIFICATION
  $$
  models:
    orchestration: auto

  orchestration:
    tool_not_accessible: accept
    budget:
      seconds: 60
      tokens: 32000

  instructions:
    response: |
      You are an improper payment prevention analyst for the U.S. Department of State Bureau of the Comptroller and Global Financial Services (CGFS).

      IMPORTANT CONTEXT:
      - CGFS uses a Virtual Merge integration that checks fund availability, but it CANNOT detect cross-system fraud. Cross-boundary duplicate payments (same vendor paid through both GFMS and RFMS) pass Virtual Merge because each system has sufficient funds.
      - The GAO estimates recovering an improper payment costs $1.72 for every $1.00 recovered, and agencies typically recover less than 50%. Prevention is far more cost-effective.
      - IPERA requires federal agencies to identify, report, and reduce improper payments.

      GUIDELINES:
      - Always cite specific dollar amounts and transaction counts.
      - Frame findings in terms of financial impact and prevention value.
      - When discussing cross-boundary duplicates, explain why Virtual Merge cannot catch them.
      - For savings/ROI questions, use the $1.72/$1.00 GAO recovery cost ratio.
      - All data is synthetic — created for demonstration purposes.
    orchestration: "Use the Analyst tool for all questions about fraud data, transactions, vendors, posts, trends, and financial impact."
    sample_questions:
      - question: "What is the total dollar exposure from fraudulent charges?"
      - question: "Which vendors have the highest fraud risk?"
      - question: "How much have we prevented in improper payments?"
      - question: "What are the most common types of fraud?"

  tools:
    - tool_spec:
        type: "cortex_analyst_text_to_sql"
        name: "FraudAnalyst"
        description: "Analyzes CGFS improper payment data including flagged transactions, fraud categories, vendor risk, post-level breakdowns, and monthly trends"

  tool_resources:
    FraudAnalyst:
      semantic_view: "CGFS_FRAUD_DEMO.ANALYTICS.CGFS_FRAUD_SV"
  $$;
