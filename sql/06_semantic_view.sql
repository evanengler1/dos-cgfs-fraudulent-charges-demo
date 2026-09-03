-- 06_semantic_view.sql: Semantic View for Cortex Agent
-- Run as CGFS_DEMO_ROLE after 05_summary_tables.sql.

USE ROLE CGFS_DEMO_ROLE;
USE WAREHOUSE CGFS_DEMO_WH;
USE DATABASE CGFS_FRAUD_DEMO;

CREATE OR REPLACE SEMANTIC VIEW ANALYTICS.CGFS_FRAUD_SV

  TABLES (
    flagged_transactions AS CGFS_FRAUD_DEMO.ANALYTICS.FRAUD_RISK_SUMMARY
      PRIMARY KEY (TRANSACTION_ID)
      COMMENT = 'Core flagged transactions with risk scores',
    fraud_by_category AS CGFS_FRAUD_DEMO.ANALYTICS.FRAUD_SUMMARY_BY_CATEGORY
      UNIQUE (FRAUD_CATEGORY)
      COMMENT = 'Fraud counts and exposure by category',
    fraud_by_post AS CGFS_FRAUD_DEMO.ANALYTICS.FRAUD_SUMMARY_BY_POST
      UNIQUE (POST_ID, SOURCE_SYSTEM)
      COMMENT = 'Flagged transactions by overseas post',
    fraud_by_vendor AS CGFS_FRAUD_DEMO.ANALYTICS.FRAUD_SUMMARY_BY_VENDOR
      PRIMARY KEY (VENDOR_ID)
      COMMENT = 'Vendors with the most flags',
    fraud_trend AS CGFS_FRAUD_DEMO.ANALYTICS.FRAUD_TREND_MONTHLY
      UNIQUE (TREND_MONTH, FRAUD_CATEGORY)
      COMMENT = 'Monthly trend of flagged amounts'
  )

  FACTS (
    flagged_transactions.payment_amount_fact AS PAYMENT_AMOUNT,
    flagged_transactions.risk_score_fact AS RISK_SCORE,
    flagged_transactions.estimated_loss_fact AS TOTAL_ESTIMATED_LOSS,
    fraud_by_category.category_flag_count AS FLAG_COUNT,
    fraud_by_category.category_exposure AS TOTAL_EXPOSURE,
    fraud_by_post.post_flag_count AS FLAG_COUNT,
    fraud_by_post.post_exposure AS TOTAL_EXPOSURE,
    fraud_by_vendor.vendor_flag_count AS FLAG_COUNT,
    fraud_by_vendor.vendor_exposure AS TOTAL_EXPOSURE,
    fraud_by_vendor.systems_involved_fact AS SYSTEMS_INVOLVED,
    fraud_trend.monthly_flag_count AS FLAG_COUNT,
    fraud_trend.monthly_exposure AS TOTAL_EXPOSURE
  )

  DIMENSIONS (
    flagged_transactions.risk_tier_dim AS RISK_TIER
      WITH SYNONYMS = ('risk level', 'severity')
      SAMPLE_VALUES ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW') IS_ENUM,
    flagged_transactions.source_system_dim AS SOURCE_SYSTEM
      WITH SYNONYMS = ('system', 'financial system')
      SAMPLE_VALUES ('GFMS', 'RFMS') IS_ENUM,
    flagged_transactions.post_id_dim AS POST_ID
      WITH SYNONYMS = ('overseas post', 'embassy'),
    flagged_transactions.vendor_id_dim AS VENDOR_ID
      WITH SYNONYMS = ('vendor', 'contractor'),
    flagged_transactions.vendor_name_dim AS VENDOR_NAME,
    flagged_transactions.disbursement_date_dim AS DISBURSEMENT_DATE
      WITH SYNONYMS = ('payment date'),
    flagged_transactions.recommended_action_dim AS RECOMMENDED_ACTION
      SAMPLE_VALUES ('BLOCK', 'REVIEW', 'MONITOR', 'PASS') IS_ENUM,
    flagged_transactions.fiscal_year AS YEAR(DISBURSEMENT_DATE)
      WITH SYNONYMS = ('FY', 'year'),
    fraud_by_category.category_name AS FRAUD_CATEGORY
      WITH SYNONYMS = ('fraud type'),
    fraud_by_category.rule_name_dim AS RULE_NAME,
    fraud_by_post.post_name AS POST_ID,
    fraud_by_vendor.vendor_name_summ AS VENDOR_NAME,
    fraud_trend.trend_month_dim AS TREND_MONTH,
    fraud_trend.trend_category AS FRAUD_CATEGORY
  )

  METRICS (
    flagged_transactions.total_flagged_amount AS SUM(flagged_transactions.estimated_loss_fact)
      WITH SYNONYMS = ('total exposure', 'total improper payments'),
    flagged_transactions.total_flagged_transactions AS COUNT(TRANSACTION_ID)
      WITH SYNONYMS = ('flag count'),
    flagged_transactions.prevention_savings AS SUM(flagged_transactions.estimated_loss_fact) * 1.72
      WITH SYNONYMS = ('recovery cost avoided', 'savings'),
    flagged_transactions.avg_risk_score AS AVG(flagged_transactions.risk_score_fact),
    flagged_transactions.critical_flags_count AS COUNT_IF(RISK_TIER = 'CRITICAL'),
    flagged_transactions.avg_payment_amount AS AVG(flagged_transactions.payment_amount_fact)
  )

  COMMENT = 'CGFS Improper Payment Prevention analytics'

  AI_SQL_GENERATION 'Always include dollar amounts. Use GAO $1.72/$1.00 recovery cost ratio for prevention savings. Virtual Merge only checks fund availability and cannot detect cross-system duplicates.'

  AI_QUESTION_CATEGORIZATION 'Answer questions about improper payments, fraud exposure, vendor risk, post-level analysis, and prevention savings for the Department of State CGFS.'

  AI_VERIFIED_QUERIES (
    total_exposure AS (
      QUESTION 'What is the total dollar exposure from fraudulent charges?'
      VERIFIED_AT 1756857600 ONBOARDING_QUESTION TRUE VERIFIED_BY '(STEWARD = cgfs_data_team)'
      SQL 'SELECT fraud_by_category.category_name, fraud_by_category.rule_name_dim, fraud_by_category.category_flag_count, fraud_by_category.category_exposure FROM fraud_by_category ORDER BY fraud_by_category.category_exposure DESC'
    ),
    top_risky_vendors AS (
      QUESTION 'Which vendors have the highest fraud risk?'
      VERIFIED_AT 1756857600 ONBOARDING_QUESTION TRUE VERIFIED_BY '(STEWARD = cgfs_data_team)'
      SQL 'SELECT fraud_by_vendor.vendor_id_dim, fraud_by_vendor.vendor_name_summ, fraud_by_vendor.vendor_flag_count, fraud_by_vendor.vendor_exposure, fraud_by_vendor.systems_involved_fact FROM fraud_by_vendor ORDER BY fraud_by_vendor.vendor_exposure DESC LIMIT 10'
    ),
    prevention_amount AS (
      QUESTION 'How much have we prevented in improper payments?'
      VERIFIED_AT 1756857600 ONBOARDING_QUESTION TRUE VERIFIED_BY '(STEWARD = cgfs_data_team)'
      SQL 'SELECT SUM(flagged_transactions.estimated_loss_fact) AS total_flagged, ROUND(SUM(flagged_transactions.estimated_loss_fact) * 1.72, 2) AS recovery_cost_avoided FROM flagged_transactions'
    ),
    common_fraud_types AS (
      QUESTION 'What are the most common types of fraud?'
      VERIFIED_AT 1756857600 ONBOARDING_QUESTION TRUE VERIFIED_BY '(STEWARD = cgfs_data_team)'
      SQL 'SELECT fraud_by_category.category_name, fraud_by_category.rule_name_dim, fraud_by_category.category_flag_count, fraud_by_category.category_exposure FROM fraud_by_category ORDER BY fraud_by_category.category_flag_count DESC'
    ),
    ghost_employees AS (
      QUESTION 'Show me ghost employee payments'
      VERIFIED_AT 1756857600 VERIFIED_BY '(STEWARD = cgfs_data_team)'
      SQL 'SELECT flagged_transactions.TRANSACTION_ID, flagged_transactions.vendor_name_dim, flagged_transactions.payment_amount_fact, flagged_transactions.disbursement_date_dim FROM flagged_transactions WHERE flagged_transactions.vendor_id_dim LIKE ''EMP-%'' ORDER BY flagged_transactions.payment_amount_fact DESC'
    ),
    flagged_by_post AS (
      QUESTION 'Which overseas posts have the most flagged transactions?'
      VERIFIED_AT 1756857600 VERIFIED_BY '(STEWARD = cgfs_data_team)'
      SQL 'SELECT fraud_by_post.post_name, fraud_by_post.post_flag_count, fraud_by_post.post_exposure FROM fraud_by_post ORDER BY fraud_by_post.post_exposure DESC'
    ),
    monthly_trend AS (
      QUESTION 'What is the monthly trend in detected fraud?'
      VERIFIED_AT 1756857600 ONBOARDING_QUESTION TRUE VERIFIED_BY '(STEWARD = cgfs_data_team)'
      SQL 'SELECT fraud_trend.trend_month_dim, fraud_trend.trend_category, fraud_trend.monthly_flag_count, fraud_trend.monthly_exposure FROM fraud_trend ORDER BY fraud_trend.trend_month_dim'
    ),
    cross_boundary AS (
      QUESTION 'Show me cross-boundary duplicate payments'
      VERIFIED_AT 1756857600 VERIFIED_BY '(STEWARD = cgfs_data_team)'
      SQL 'SELECT flagged_transactions.TRANSACTION_ID, flagged_transactions.vendor_name_dim, flagged_transactions.payment_amount_fact, flagged_transactions.source_system_dim, flagged_transactions.post_id_dim FROM flagged_transactions WHERE flagged_transactions.TRANSACTION_ID LIKE ''GFMS-XDUP%'' ORDER BY flagged_transactions.payment_amount_fact DESC'
    ),
    recovery_cost AS (
      QUESTION 'What would it cost to recover these improper payments after the fact?'
      VERIFIED_AT 1756857600 VERIFIED_BY '(STEWARD = cgfs_data_team)'
      SQL 'SELECT SUM(flagged_transactions.estimated_loss_fact) AS total_at_risk, ROUND(SUM(flagged_transactions.estimated_loss_fact) * 1.72, 2) AS recovery_cost, ROUND(SUM(flagged_transactions.estimated_loss_fact) * 0.50, 2) AS likely_recovered FROM flagged_transactions'
    ),
    largest_payment AS (
      QUESTION 'What is the highest single improper payment detected?'
      VERIFIED_AT 1756857600 VERIFIED_BY '(STEWARD = cgfs_data_team)'
      SQL 'SELECT flagged_transactions.TRANSACTION_ID, flagged_transactions.vendor_name_dim, flagged_transactions.payment_amount_fact, flagged_transactions.risk_tier_dim, flagged_transactions.estimated_loss_fact, flagged_transactions.source_system_dim FROM flagged_transactions ORDER BY flagged_transactions.estimated_loss_fact DESC LIMIT 1'
    )
  );
