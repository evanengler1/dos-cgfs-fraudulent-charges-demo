-- 04_ml_anomaly.sql: Statistical Anomaly Detection
-- Scores transactions using z-scores by post, flags outliers that rules missed.
-- Run as CGFS_DEMO_ROLE after 03_analytics_pipeline.sql.

USE ROLE CGFS_DEMO_ROLE;
USE WAREHOUSE CGFS_DEMO_WH;
USE DATABASE CGFS_FRAUD_DEMO;

CREATE OR REPLACE TABLE ANALYTICS.ML_ANOMALY_FLAGS AS
WITH stats_by_post AS (
    SELECT COALESCE(POST_ID, 'DOMESTIC') AS GROUP_KEY,
           AVG(PAYMENT_AMOUNT) AS AVG_AMT,
           STDDEV(PAYMENT_AMOUNT) AS STD_AMT,
           PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY PAYMENT_AMOUNT) AS P99_AMT
    FROM ANALYTICS.UNIFIED_TRANSACTIONS
    GROUP BY 1
    HAVING COUNT(*) >= 20
),
rule_caught AS (
    SELECT DISTINCT TRANSACTION_ID FROM ANALYTICS.RULES_ENGINE_FLAGS
),
scored AS (
    SELECT ut.TRANSACTION_ID, ut.SOURCE_SYSTEM, ut.VENDOR_ID, ut.VENDOR_NAME,
           ut.PAYMENT_AMOUNT, ut.DISBURSEMENT_DATE, ut.POST_ID,
           s.AVG_AMT, s.STD_AMT,
           CASE WHEN s.STD_AMT > 0 THEN (ut.PAYMENT_AMOUNT - s.AVG_AMT) / s.STD_AMT ELSE 0 END AS Z_SCORE
    FROM ANALYTICS.UNIFIED_TRANSACTIONS ut
    JOIN stats_by_post s ON COALESCE(ut.POST_ID, 'DOMESTIC') = s.GROUP_KEY
    LEFT JOIN rule_caught rc ON ut.TRANSACTION_ID = rc.TRANSACTION_ID
    WHERE rc.TRANSACTION_ID IS NULL          -- exclude transactions already caught by rules
      AND ut.PAYMENT_AMOUNT > s.P99_AMT     -- only look at top 1% amounts
)
SELECT TRANSACTION_ID, SOURCE_SYSTEM, VENDOR_ID, VENDOR_NAME, PAYMENT_AMOUNT,
       DISBURSEMENT_DATE, POST_ID,
       ROUND(Z_SCORE, 3) AS ANOMALY_SCORE,
       TRUE AS IS_ANOMALY,
       CASE WHEN Z_SCORE > 6.0 THEN 'CRITICAL'
            WHEN Z_SCORE > 5.5 THEN 'HIGH'
            ELSE 'MEDIUM'
       END AS ANOMALY_SEVERITY,
       'Statistical outlier: $' || TO_VARCHAR(PAYMENT_AMOUNT, '999,999,999.99') ||
       ' is ' || ROUND(Z_SCORE, 1) || 'x std dev above mean for this post.' ||
       ' Passed all rules — flagged by anomaly model.' AS EXPLANATION
FROM scored
WHERE Z_SCORE > 5.0;
