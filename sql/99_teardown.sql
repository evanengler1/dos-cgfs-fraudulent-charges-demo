-- 99_teardown.sql: Complete CGFS Demo Cleanup
-- Run with ACCOUNTADMIN to ensure all objects can be dropped.
-- Drops in reverse dependency order.

USE ROLE ACCOUNTADMIN;

-- 1. Drop Cortex Agent
DROP AGENT IF EXISTS CGFS_FRAUD_DEMO.ANALYTICS.CGFS_FRAUD_AGENT;

-- 2. Drop Semantic View
DROP SEMANTIC VIEW IF EXISTS CGFS_FRAUD_DEMO.ANALYTICS.CGFS_FRAUD_SV;

-- 3. Drop the entire database (takes all schemas, tables, DTs, views with it)
DROP DATABASE IF EXISTS CGFS_FRAUD_DEMO;

-- 4. Drop warehouse
DROP WAREHOUSE IF EXISTS CGFS_DEMO_WH;

-- 5. Drop custom role
REVOKE ROLE CGFS_DEMO_ROLE FROM USER EENGLER;
REVOKE ROLE CGFS_DEMO_ROLE FROM ROLE SYSADMIN;
DROP ROLE IF EXISTS CGFS_DEMO_ROLE;
