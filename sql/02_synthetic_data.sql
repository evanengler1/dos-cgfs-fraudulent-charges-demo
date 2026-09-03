-- 02_synthetic_data.sql: CGFS Improper Payment Prevention Demo — Synthetic Data Generation
-- Generates ~1.5M rows across 5 tables with 75+ planted anomalies.
-- Uses UNIFORM+JOIN pattern for proper randomization (NOT CROSS JOIN LATERAL).
-- Run as CGFS_DEMO_ROLE after 01_provision.sql.

USE ROLE CGFS_DEMO_ROLE;
USE WAREHOUSE CGFS_DEMO_WH;
USE DATABASE CGFS_FRAUD_DEMO;
USE SCHEMA RAW;

----------------------------------------------------------------------
-- 1. DEBARRED_VENDORS (reference table, 20 rows)
----------------------------------------------------------------------

CREATE OR REPLACE TABLE RAW.DEBARRED_VENDORS (
    VENDOR_ID       VARCHAR,
    VENDOR_NAME     VARCHAR,
    DEBARMENT_DATE  DATE,
    REASON          VARCHAR
);

INSERT INTO RAW.DEBARRED_VENDORS VALUES
('V-9901', 'Greystone Defense Consulting', '2023-06-15', 'False claims on contract deliverables'),
('V-9902', 'Meridian Logistics Partners', '2023-08-22', 'Bribery of foreign officials'),
('V-9903', 'Atlas Worldwide Security', '2022-11-01', 'Defective products delivered to embassy'),
('V-9904', 'Pinnacle Construction Intl', '2024-01-10', 'Bid rigging on overseas construction'),
('V-9905', 'Nexus IT Solutions Group', '2023-03-05', 'Wire fraud in billing'),
('V-9906', 'Falcon Air Transport LLC', '2023-09-18', 'Safety violations and falsified maintenance records'),
('V-9907', 'Sovereign Risk Advisors', '2022-07-30', 'Conflict of interest — undisclosed govt ties'),
('V-9908', 'Trident Marine Services', '2024-02-28', 'Environmental violations at port facility'),
('V-9909', 'Vanguard Personnel Staffing', '2023-12-01', 'Kickback scheme with contracting officers'),
('V-9910', 'Emerald Coast Trading Co', '2023-04-12', 'Customs fraud and smuggling'),
('V-9911', 'Obsidian Communications', '2024-03-15', 'Wiretapping equipment sales violations'),
('V-9912', 'Pacific Rim Consulting', '2022-10-20', 'Tax evasion and shell company fraud'),
('V-9913', 'Ironclad Protective Services', '2023-07-08', 'Use of unlicensed personnel overseas'),
('V-9914', 'Summit Engineering Works', '2024-05-01', 'Structural deficiencies in embassy renovation'),
('V-9915', 'Crimson Bay Imports', '2023-01-25', 'Import/export sanctions violations'),
('V-9916', 'Sterling Medical Supplies', '2024-04-18', 'Counterfeit medical supplies'),
('V-9917', 'Brightpath Energy Solutions', '2023-11-10', 'Overcharging on energy contracts'),
('V-9918', 'Oaktree Diplomatic Housing', '2024-06-01', 'Housing safety code violations'),
('V-9919', 'Heritage Translation Svcs', '2023-05-20', 'Fraudulent translator certifications'),
('V-9920', 'Continental Fleet Management', '2024-07-15', 'Embezzlement of vehicle maintenance funds');

----------------------------------------------------------------------
-- 2. GFMS_TRANSACTIONS (domestic disbursements, ~50K rows)
----------------------------------------------------------------------

CREATE OR REPLACE TABLE RAW.GFMS_TRANSACTIONS (
    TRANSACTION_ID      VARCHAR,
    OBLIGATION_ID       VARCHAR,
    APPROPRIATION_CODE  VARCHAR,
    VENDOR_ID           VARCHAR,
    VENDOR_NAME         VARCHAR,
    PAYMENT_AMOUNT      NUMBER(15,2),
    OBLIGATION_CEILING  NUMBER(15,2),
    DISBURSEMENT_DATE   DATE,
    DESCRIPTION         VARCHAR,
    CONTRACT_ID         VARCHAR,
    BUREAU_CODE         VARCHAR
);

INSERT INTO RAW.GFMS_TRANSACTIONS
WITH
vendors AS (
    SELECT ROW_NUMBER() OVER (ORDER BY 1) AS VID, v.* FROM (VALUES
        ('V-1001','Booz Allen Hamilton'),('V-1002','Deloitte Government Services'),
        ('V-1003','SAIC Inc'),('V-1004','Leidos Holdings'),('V-1005','ManTech International'),
        ('V-1006','Perspecta Inc'),('V-1007','CACI International'),('V-1008','CGI Federal'),
        ('V-1009','Accenture Federal'),('V-1010','IBM Government'),
        ('V-1011','Northrop Grumman IT'),('V-1012','Raytheon Technical Services'),
        ('V-1013','General Dynamics IT'),('V-1014','BAE Systems Support'),
        ('V-1015','L3Harris Technologies'),('V-1016','Lockheed Martin Services'),
        ('V-1017','Jacobs Engineering'),('V-1018','KBR Government Solutions'),
        ('V-1019','Serco Group Inc'),('V-1020','DXC Technology Govt'),
        ('V-1021','Unisys Federal'),('V-1022','Maximus Inc'),
        ('V-1023','ICF International'),('V-1024','Engility Holdings'),
        ('V-1025','CSRA Inc'),('V-1026','Battelle Memorial'),
        ('V-1027','Alion Science'),('V-1028','AECOM Government'),
        ('V-1029','Parsons Corporation'),('V-1030','Fluor Government Group'),
        ('V-1031','PAE Incorporated'),('V-1032','DLT Solutions'),
        ('V-1033','Vencore Inc'),('V-1034','KeyW Corporation'),
        ('V-1035','Sotera Defense'),('V-1036','CALIBRE Systems'),
        ('V-1037','Torch Technologies'),('V-1038','Salient Federal Solutions'),
        ('V-1039','Smartronix Inc'),('V-1040','Halfaker and Associates'),
        ('V-1041','Capitol Consulting Group'),('V-1042','Bravura Information Technology'),
        ('V-1043','Credence Management Solutions'),('V-1044','Definitive Logic'),
        ('V-1045','Eastern Research Group'),('V-1046','Federal Management Partners'),
        ('V-1047','Grant Thornton LLP'),('V-1048','HumanTouch LLC'),
        ('V-1049','IntelliDyne LLC'),('V-1050','JBS International')
    ) AS v(VENDOR_ID, VENDOR_NAME)
),
descriptions AS (
    SELECT ROW_NUMBER() OVER (ORDER BY 1) AS DID, d.* FROM (VALUES
        ('IT infrastructure modernization services'),('Cybersecurity assessment and monitoring'),
        ('Diplomatic pouch logistics support'),('Facilities maintenance and repair'),
        ('Language training program delivery'),('Consular systems software development'),
        ('Building security systems upgrade'),('Travel management services'),
        ('Financial management consulting'),('Data analytics platform support'),
        ('Cloud migration services'),('Network infrastructure upgrade'),
        ('Personnel background investigation'),('Document translation services'),
        ('Emergency communications equipment'),('HVAC system replacement'),
        ('Motor pool fleet management'),('Medical supplies procurement'),
        ('Furniture and equipment procurement'),('Training program development')
    ) AS d(DESC_TEXT)
),
approp_codes AS (
    SELECT ROW_NUMBER() OVER (ORDER BY 1) AS AID, a.* FROM (VALUES
        ('19-0113/0117'),('19-0520/0525'),('19-0201/0205'),('19-0401/0405'),
        ('19-0301/0305'),('19-0601/0605'),('19-0113/0118'),('19-0701/0705'),
        ('19-0801/0805'),('19-0901/0905')
    ) AS a(CODE)
),
bureaus AS (
    SELECT ROW_NUMBER() OVER (ORDER BY 1) AS BID, b.* FROM (VALUES
        ('A'),('AF'),('CA'),('DS'),('EAP'),('EUR'),('IO'),('NEA'),('OES'),
        ('PM'),('SCA'),('WHA'),('DRL'),('INL'),('ISN'),('OBO')
    ) AS b(CODE)
),
raw_rows AS (
    SELECT
        SEQ4() + 1 AS RN,
        UNIFORM(1, 50, RANDOM()) AS V_IDX,
        UNIFORM(1, 20, RANDOM()) AS D_IDX,
        UNIFORM(1, 10, RANDOM()) AS A_IDX,
        UNIFORM(1, 16, RANDOM()) AS B_IDX,
        UNIFORM(0, 729, RANDOM()) AS DATE_OFF,
        UNIFORM(1, 100, RANDOM()) AS AMT_BUCKET,
        UNIFORM(1, 100, RANDOM()) AS CTR_ROLL,
        UNIFORM(1, 2500, RANDOM()) AS OBL_NUM,
        RANDOM() AS RND
    FROM TABLE(GENERATOR(ROWCOUNT => 49500))
)
SELECT
    'GFMS-' || LPAD(r.RN::VARCHAR, 7, '0'),
    'OBL-' || LPAD(r.OBL_NUM::VARCHAR, 5, '0'),
    ac.CODE, v.VENDOR_ID, v.VENDOR_NAME,
    ROUND(CASE
        WHEN r.AMT_BUCKET <= 60 THEN UNIFORM(1000, 25000, r.RND)
        WHEN r.AMT_BUCKET <= 85 THEN UNIFORM(25000, 75000, r.RND)
        WHEN r.AMT_BUCKET <= 95 THEN UNIFORM(75000, 200000, r.RND)
        ELSE UNIFORM(200000, 500000, r.RND)
    END, 2),
    NULL,
    DATEADD(DAY, r.DATE_OFF, '2023-10-01'::DATE),
    d.DESC_TEXT,
    CASE WHEN r.CTR_ROLL <= 70 THEN 'CTR-' || LPAD(UNIFORM(1000, 9999, r.RND)::VARCHAR, 4, '0') ELSE NULL END,
    b.CODE
FROM raw_rows r
JOIN vendors v ON v.VID = r.V_IDX
JOIN descriptions d ON d.DID = r.D_IDX
JOIN approp_codes ac ON ac.AID = r.A_IDX
JOIN bureaus b ON b.BID = r.B_IDX;

-- Set obligation ceilings
UPDATE RAW.GFMS_TRANSACTIONS t
SET t.OBLIGATION_CEILING = obl.CEILING_AMT
FROM (
    SELECT OBLIGATION_ID,
           ROUND(SUM(PAYMENT_AMOUNT) * (1.05 + UNIFORM(0, 45, RANDOM()) / 100.0), 2) AS CEILING_AMT
    FROM RAW.GFMS_TRANSACTIONS
    GROUP BY OBLIGATION_ID
) obl
WHERE t.OBLIGATION_ID = obl.OBLIGATION_ID;

----------------------------------------------------------------------
-- 3. RFMS_TRANSACTIONS (overseas disbursements, ~40K rows)
----------------------------------------------------------------------

CREATE OR REPLACE TABLE RAW.RFMS_TRANSACTIONS (
    TRANSACTION_ID  VARCHAR,
    OBLIGATION_ID   VARCHAR,
    POST_ID         VARCHAR,
    VENDOR_ID       VARCHAR,
    VENDOR_NAME     VARCHAR,
    PAYMENT_AMOUNT  NUMBER(15,2),
    DISBURSEMENT_DATE DATE,
    DESCRIPTION     VARCHAR,
    CONTRACT_ID     VARCHAR,
    CURRENCY_CODE   VARCHAR
);

INSERT INTO RAW.RFMS_TRANSACTIONS
WITH
posts AS (
    SELECT ROW_NUMBER() OVER (ORDER BY 1) AS PID, p.* FROM (VALUES
        ('PARIS','EUR'),('LONDON','GBP'),('NAIROBI','KES'),('TOKYO','JPY'),
        ('MEXICO_CITY','MXN'),('BAGHDAD','IQD'),('KABUL','AFN'),('BERLIN','EUR'),
        ('ROME','EUR'),('CAIRO','EGP'),('BRASILIA','BRL'),('NEW_DELHI','INR'),
        ('BEIJING','CNY'),('MOSCOW','RUB'),('ANKARA','TRY'),('JAKARTA','IDR'),
        ('BANGKOK','THB'),('BOGOTA','COP'),('PRETORIA','ZAR'),('MANILA','PHP'),
        ('ACCRA','GHS'),('DAKAR','XOF'),('ADDIS_ABABA','ETB'),('AMMAN','JOD'),
        ('ISLAMABAD','PKR'),('DHAKA','BDT'),('LIMA','PEN'),('SANTIAGO','CLP'),
        ('BUENOS_AIRES','ARS'),('KINSHASA','CDF')
    ) AS p(POST_ID, CURRENCY)
),
overseas_vendors AS (
    SELECT ROW_NUMBER() OVER (ORDER BY 1) AS VID, v.* FROM (VALUES
        ('V-2001','Global Facilities Management Ltd'),('V-2002','InterContinental Security Group'),
        ('V-2003','Sahel Logistics Partners'),('V-2004','Pacific Bridge Construction'),
        ('V-2005','EuroTech Solutions GmbH'),('V-2006','Afri-Guard Services'),
        ('V-2007','Tokyo Systems Integration'),('V-2008','MedEast Translation Bureau'),
        ('V-2009','Andean Engineering Corp'),('V-2010','British Council Training'),
        ('V-2011','Deutsche Facilities GmbH'),('V-2012','Cairo Construction Co'),
        ('V-2013','Mumbai IT Outsourcing'),('V-2014','Beijing Diplomatic Services'),
        ('V-2015','South Atlantic Shipping'),('V-2016','Pan-African Consulting'),
        ('V-2017','Nordic Supply Chain AB'),('V-2018','Southeast Asia Logistics'),
        ('V-2019','Caribbean Security Solutions'),('V-2020','Himalayan Transport Co'),
        ('V-2021','Caspian Energy Services'),('V-2022','Balkan Infrastructure Group'),
        ('V-2023','Trans-Saharan Freight'),('V-2024','Coral Sea Marine Services'),
        ('V-2025','Alpine Medical Supplies AG'),('V-2026','Andes Construction SA'),
        ('V-2027','Great Wall Technology'),('V-2028','Silk Road Trading Co'),
        ('V-2029','Horn of Africa Logistics'),('V-2030','Mekong Delta Services'),
        ('V-2031','Atlas Mediterranean Group'),('V-2032','Serengeti Support Services'),
        ('V-2033','Ganges River Transport'),('V-2034','Amazonian Resources Ltd'),
        ('V-2035','Danube Consulting GmbH'),('V-2036','Congo Basin Development'),
        ('V-2037','Polynesian Comm Systems'),('V-2038','Saharan Solar Energy'),
        ('V-2039','Carpathian Construction'),('V-2040','Nilotic Water Services')
    ) AS v(VENDOR_ID, VENDOR_NAME)
),
descriptions AS (
    SELECT ROW_NUMBER() OVER (ORDER BY 1) AS DID, d.* FROM (VALUES
        ('Embassy compound maintenance'),('Local guard force services'),
        ('Residential housing lease payments'),('Armored vehicle maintenance'),
        ('Local staff medical insurance'),('Diplomatic pouch logistics'),
        ('Utility payments for embassy compound'),('Cultural exchange program costs'),
        ('Emergency evacuation planning'),('Document shredding services'),
        ('Marine security guard support'),('IT network maintenance overseas'),
        ('Air filtration system servicing'),('Generator fuel procurement'),
        ('Local language instruction'),('Visa processing equipment'),
        ('Perimeter security upgrade'),('Water purification systems'),
        ('Seismic retrofitting services'),('Fire suppression system maintenance')
    ) AS d(DESC_TEXT)
),
raw_rows AS (
    SELECT
        SEQ4() + 1 AS RN,
        UNIFORM(1, 40, RANDOM()) AS V_IDX,
        UNIFORM(1, 20, RANDOM()) AS D_IDX,
        UNIFORM(1, 30, RANDOM()) AS P_IDX,
        UNIFORM(0, 729, RANDOM()) AS DATE_OFF,
        UNIFORM(1, 100, RANDOM()) AS AMT_BUCKET,
        UNIFORM(1, 100, RANDOM()) AS CTR_ROLL,
        UNIFORM(1, 2500, RANDOM()) AS OBL_NUM,
        RANDOM() AS RND
    FROM TABLE(GENERATOR(ROWCOUNT => 39500))
)
SELECT
    'RFMS-' || LPAD(r.RN::VARCHAR, 7, '0'),
    'OBL-' || LPAD(r.OBL_NUM::VARCHAR, 5, '0'),
    p.POST_ID, v.VENDOR_ID, v.VENDOR_NAME,
    ROUND(CASE
        WHEN r.AMT_BUCKET <= 55 THEN UNIFORM(500, 20000, r.RND)
        WHEN r.AMT_BUCKET <= 85 THEN UNIFORM(20000, 60000, r.RND)
        WHEN r.AMT_BUCKET <= 95 THEN UNIFORM(60000, 150000, r.RND)
        ELSE UNIFORM(150000, 400000, r.RND)
    END, 2),
    DATEADD(DAY, r.DATE_OFF, '2023-10-01'::DATE),
    d.DESC_TEXT,
    CASE WHEN r.CTR_ROLL <= 60 THEN 'CTR-' || LPAD(UNIFORM(1000, 9999, r.RND)::VARCHAR, 4, '0') ELSE NULL END,
    p.CURRENCY
FROM raw_rows r
JOIN posts p ON p.PID = r.P_IDX
JOIN overseas_vendors v ON v.VID = r.V_IDX
JOIN descriptions d ON d.DID = r.D_IDX;

----------------------------------------------------------------------
-- 4. GFACS_PAYROLL (~120K rows for ~2500 employees)
----------------------------------------------------------------------

CREATE OR REPLACE TABLE RAW.GFACS_PAYROLL (
    PAYROLL_ID VARCHAR, EMPLOYEE_ID VARCHAR, EMPLOYEE_NAME VARCHAR,
    PAY_PERIOD_START DATE, PAY_PERIOD_END DATE, GROSS_PAY NUMBER(12,2),
    NET_PAY NUMBER(12,2), GRADE VARCHAR, STEP NUMBER,
    EMPLOYMENT_STATUS VARCHAR, SEPARATION_DATE DATE, STAFF_TYPE VARCHAR, POST_ID VARCHAR
);

INSERT INTO RAW.GFACS_PAYROLL
WITH
first_names_us AS (SELECT ROW_NUMBER() OVER (ORDER BY 1) AS FID, n.NAME FROM (VALUES ('James'),('Mary'),('Robert'),('Patricia'),('John'),('Jennifer'),('Michael'),('Linda'),('David'),('Elizabeth'),('William'),('Barbara'),('Richard'),('Susan'),('Joseph'),('Jessica'),('Thomas'),('Sarah'),('Christopher'),('Karen'),('Charles'),('Lisa'),('Daniel'),('Nancy'),('Matthew'),('Betty'),('Anthony'),('Margaret'),('Mark'),('Sandra'),('Donald'),('Ashley'),('Steven'),('Kimberly'),('Andrew'),('Emily'),('Paul'),('Donna'),('Joshua'),('Michelle'),('Kenneth'),('Carol'),('Kevin'),('Amanda'),('Brian'),('Dorothy'),('George'),('Melissa'),('Timothy'),('Deborah')) AS n(NAME)),
first_names_le AS (SELECT ROW_NUMBER() OVER (ORDER BY 1) AS FID, n.NAME FROM (VALUES ('Amir'),('Fatima'),('Pierre'),('Yuki'),('Carlos'),('Mei'),('Abdul'),('Priya'),('Jean-Claude'),('Aisha'),('Kenji'),('Olga'),('Rafael'),('Nadia'),('Dimitri'),('Leila'),('Hans'),('Sakura'),('Kofi'),('Ingrid'),('Rajesh'),('Elena'),('Omar'),('Lucia'),('Kwame'),('Svetlana'),('Hiroshi'),('Amara'),('Felipe'),('Valentina'),('Achille'),('Blessing'),('Ravi'),('Astrid'),('Moussa'),('Tatiana'),('Takeshi'),('Chioma'),('Alejandro'),('Meera')) AS n(NAME)),
last_names AS (SELECT ROW_NUMBER() OVER (ORDER BY 1) AS LID, n.NAME FROM (VALUES ('Smith'),('Johnson'),('Williams'),('Brown'),('Jones'),('Garcia'),('Miller'),('Davis'),('Rodriguez'),('Martinez'),('Anderson'),('Taylor'),('Thomas'),('Jackson'),('White'),('Harris'),('Martin'),('Thompson'),('Robinson'),('Clark'),('Lewis'),('Lee'),('Walker'),('Hall'),('Allen'),('Young'),('King'),('Wright'),('Lopez'),('Hill'),('Scott'),('Green'),('Adams'),('Baker'),('Nelson'),('Carter'),('Mitchell'),('Perez'),('Roberts'),('Turner'),('Phillips'),('Campbell'),('Parker'),('Evans'),('Edwards'),('Collins'),('Stewart'),('Sanchez'),('Morris'),('Rogers')) AS n(NAME)),
grades AS (SELECT ROW_NUMBER() OVER (ORDER BY 1) AS GID, g.GRADE, g.BASE_PAY FROM (VALUES ('GS-05',35000),('GS-07',42000),('GS-09',51000),('GS-11',62000),('GS-12',74000),('GS-13',88000),('GS-14',104000),('GS-15',122000),('LE-05',22000),('LE-07',28000),('LE-09',35000),('LE-10',40000),('LE-11',45000)) AS g(GRADE, BASE_PAY)),
posts AS (SELECT ROW_NUMBER() OVER (ORDER BY 1) AS PID, p.POST_ID FROM (VALUES ('WASHINGTON'),('PARIS'),('LONDON'),('NAIROBI'),('TOKYO'),('MEXICO_CITY'),('BAGHDAD'),('KABUL'),('BERLIN'),('ROME'),('CAIRO'),('BRASILIA'),('NEW_DELHI'),('BEIJING'),('ANKARA'),('JAKARTA'),('BANGKOK'),('BOGOTA'),('PRETORIA'),('MANILA'),('ACCRA'),('DAKAR'),('ADDIS_ABABA'),('AMMAN')) AS p(POST_ID)),
raw_employees AS (
    SELECT SEQ4() + 1 AS EMP_NUM, UNIFORM(1,50,RANDOM()) AS FN_US_IDX, UNIFORM(1,40,RANDOM()) AS FN_LE_IDX,
           UNIFORM(1,50,RANDOM()) AS LN_IDX, UNIFORM(1,13,RANDOM()) AS G_IDX, UNIFORM(1,24,RANDOM()) AS P_IDX,
           UNIFORM(1,10,RANDOM()) AS STEP_VAL, UNIFORM(1,100,RANDOM()) AS STAFF_ROLL,
           UNIFORM(1,100,RANDOM()) AS STATUS_ROLL, UNIFORM(30,500,RANDOM()) AS SEP_DAYS_AGO
    FROM TABLE(GENERATOR(ROWCOUNT => 2500))
),
employees AS (
    SELECT re.EMP_NUM, 'EMP-' || LPAD(re.EMP_NUM::VARCHAR, 5, '0') AS EMPLOYEE_ID,
        CASE WHEN re.STAFF_ROLL <= 55 THEN fn_us.NAME || ' ' || ln.NAME ELSE fn_le.NAME || ' ' || ln.NAME END AS EMPLOYEE_NAME,
        CASE WHEN re.STAFF_ROLL <= 55 THEN 'AMERICAN' ELSE 'LE_STAFF' END AS STAFF_TYPE,
        g.GRADE, g.BASE_PAY, re.STEP_VAL AS STEP, p.POST_ID,
        CASE WHEN re.STATUS_ROLL <= 88 THEN 'ACTIVE' WHEN re.STATUS_ROLL <= 94 THEN 'SEPARATED'
             WHEN re.STATUS_ROLL <= 97 THEN 'TERMINATED' ELSE 'ON_LEAVE' END AS EMPLOYMENT_STATUS,
        CASE WHEN re.STATUS_ROLL > 88 THEN DATEADD(DAY, -re.SEP_DAYS_AGO, CURRENT_DATE()) ELSE NULL END AS SEPARATION_DATE
    FROM raw_employees re
    JOIN first_names_us fn_us ON fn_us.FID = re.FN_US_IDX
    JOIN first_names_le fn_le ON fn_le.FID = re.FN_LE_IDX
    JOIN last_names ln ON ln.LID = re.LN_IDX
    JOIN grades g ON g.GID = re.G_IDX
    JOIN posts p ON p.PID = re.P_IDX
),
pay_periods AS (
    SELECT DATEADD(DAY, (pp.N-1)*14, '2023-10-01'::DATE) AS PP_START,
           DATEADD(DAY, (pp.N-1)*14+13, '2023-10-01'::DATE) AS PP_END
    FROM (SELECT SEQ4()+1 AS N FROM TABLE(GENERATOR(ROWCOUNT => 52))) pp
    WHERE DATEADD(DAY, (pp.N-1)*14, '2023-10-01'::DATE) <= '2025-09-30'::DATE
)
SELECT 'PAY-' || LPAD(ROW_NUMBER() OVER (ORDER BY e.EMPLOYEE_ID, pp.PP_START)::VARCHAR, 8, '0'),
    e.EMPLOYEE_ID, e.EMPLOYEE_NAME, pp.PP_START, pp.PP_END,
    ROUND(e.BASE_PAY/26 * (1+e.STEP*0.03) * (1+UNIFORM(-5,5,RANDOM())/100.0), 2),
    ROUND(e.BASE_PAY/26 * (1+e.STEP*0.03) * (1+UNIFORM(-5,5,RANDOM())/100.0) * 0.72, 2),
    e.GRADE, e.STEP,
    CASE WHEN e.SEPARATION_DATE IS NOT NULL AND pp.PP_START > e.SEPARATION_DATE THEN e.EMPLOYMENT_STATUS ELSE 'ACTIVE' END,
    e.SEPARATION_DATE, e.STAFF_TYPE, e.POST_ID
FROM employees e CROSS JOIN pay_periods pp
WHERE pp.PP_START <= COALESCE(e.SEPARATION_DATE + 14, '2025-09-30'::DATE);

----------------------------------------------------------------------
-- 5. GTA_TIME_ATTENDANCE (~1M+ rows)
----------------------------------------------------------------------

CREATE OR REPLACE TABLE RAW.GTA_TIME_ATTENDANCE (
    RECORD_ID VARCHAR, EMPLOYEE_ID VARCHAR, RECORD_DATE DATE,
    HOURS_CLAIMED NUMBER(4,1), STATUS_CODE VARCHAR, POST_ID VARCHAR
);

INSERT INTO RAW.GTA_TIME_ATTENDANCE
WITH
employees AS (SELECT DISTINCT EMPLOYEE_ID, POST_ID FROM RAW.GFACS_PAYROLL
    WHERE EMPLOYMENT_STATUS = 'ACTIVE' OR (SEPARATION_DATE IS NOT NULL AND SEPARATION_DATE >= '2023-10-01')),
work_dates AS (SELECT DATEADD(DAY, SEQ4(), '2023-10-01'::DATE) AS WORK_DATE FROM TABLE(GENERATOR(ROWCOUNT => 730))
    WHERE DAYOFWEEK(DATEADD(DAY, SEQ4(), '2023-10-01'::DATE)) NOT IN (0, 6))
SELECT 'GTA-' || LPAD(ROW_NUMBER() OVER (ORDER BY e.EMPLOYEE_ID, wd.WORK_DATE)::VARCHAR, 8, '0'),
    e.EMPLOYEE_ID, wd.WORK_DATE,
    CASE WHEN UNIFORM(1,100,RANDOM()) <= 80 THEN 8.0
         WHEN UNIFORM(1,100,RANDOM()) <= 90 THEN ROUND(UNIFORM(6,10,RANDOM())+UNIFORM(0,1,RANDOM())*0.5, 1)
         ELSE 8.0 END,
    CASE WHEN UNIFORM(1,1000,RANDOM()) <= 850 THEN 'REGULAR'
         WHEN UNIFORM(1,1000,RANDOM()) <= 900 THEN 'ANNUAL_LEAVE'
         WHEN UNIFORM(1,1000,RANDOM()) <= 940 THEN 'SICK_LEAVE'
         WHEN UNIFORM(1,1000,RANDOM()) <= 970 THEN 'TRAVEL'
         WHEN UNIFORM(1,1000,RANDOM()) <= 990 THEN 'LWOP'
         ELSE 'HOLIDAY' END,
    e.POST_ID
FROM employees e CROSS JOIN work_dates wd
WHERE wd.WORK_DATE <= COALESCE(
    (SELECT MAX(p.SEPARATION_DATE) FROM RAW.GFACS_PAYROLL p WHERE p.EMPLOYEE_ID = e.EMPLOYEE_ID), '2025-09-30'::DATE)
  AND UNIFORM(1, 100, RANDOM()) <= 97;

----------------------------------------------------------------------
-- ANOMALY PLANTING (75+ anomalies across 7 categories)
----------------------------------------------------------------------

-- ANOMALY 1: Ghost Employee Payments (12 employees, ~96 payments)
INSERT INTO RAW.GFMS_TRANSACTIONS
WITH ghost_employees AS (
    SELECT EMPLOYEE_ID, EMPLOYEE_NAME, SEPARATION_DATE, POST_ID, GROSS_PAY FROM (
        SELECT EMPLOYEE_ID, EMPLOYEE_NAME, SEPARATION_DATE, POST_ID, AVG(GROSS_PAY) AS GROSS_PAY,
               ROW_NUMBER() OVER (ORDER BY RANDOM()) AS RN
        FROM RAW.GFACS_PAYROLL WHERE SEPARATION_DATE IS NOT NULL AND SEPARATION_DATE < '2025-06-01'
        GROUP BY EMPLOYEE_ID, EMPLOYEE_NAME, SEPARATION_DATE, POST_ID
    ) WHERE RN <= 12
),
ghost_payments AS (
    SELECT ge.*, DATEADD(DAY, 14*pp.N, ge.SEPARATION_DATE) AS PAY_DATE
    FROM ghost_employees ge CROSS JOIN (SELECT SEQ4()+1 AS N FROM TABLE(GENERATOR(ROWCOUNT => 8))) pp
    WHERE DATEADD(DAY, 14*pp.N, ge.SEPARATION_DATE) <= '2025-09-30'
)
SELECT 'GFMS-GHOST-' || LPAD(ROW_NUMBER() OVER (ORDER BY EMPLOYEE_ID, PAY_DATE)::VARCHAR, 4, '0'),
    'OBL-GHOST-' || LPAD(ROW_NUMBER() OVER (ORDER BY RANDOM())::VARCHAR, 4, '0'),
    '19-0113/0117', EMPLOYEE_ID, EMPLOYEE_NAME,
    ROUND(GROSS_PAY * (1+UNIFORM(-3,3,RANDOM())/100.0), 2), ROUND(GROSS_PAY*12, 2),
    PAY_DATE, 'Payroll disbursement - biweekly compensation', NULL, 'A'
FROM ghost_payments;

-- ANOMALY 2: Cross-Boundary Duplicate Payments (10 cases)
INSERT INTO RAW.GFMS_TRANSACTIONS
SELECT 'GFMS-XDUP-' || LPAD(ROW_NUMBER() OVER (ORDER BY RANDOM())::VARCHAR, 4, '0'),
    OBLIGATION_ID, '19-0520/0525', VENDOR_ID, VENDOR_NAME,
    ROUND(PAYMENT_AMOUNT * (0.95+UNIFORM(0,10,RANDOM())/100.0), 2), ROUND(PAYMENT_AMOUNT*5, 2),
    DATEADD(DAY, UNIFORM(-3,3,RANDOM()), DISBURSEMENT_DATE), DESCRIPTION, CONTRACT_ID, 'EUR'
FROM (SELECT *, ROW_NUMBER() OVER (ORDER BY RANDOM()) AS RN FROM RAW.RFMS_TRANSACTIONS WHERE PAYMENT_AMOUNT >= 25000) WHERE RN <= 10;

-- ANOMALY 3: Over-Obligation Payments (10 cases)
INSERT INTO RAW.GFMS_TRANSACTIONS
WITH over_obligations AS (
    SELECT OBLIGATION_ID, OBLIGATION_CEILING, SUM(PAYMENT_AMOUNT) AS CURRENT_TOTAL,
           ANY_VALUE(VENDOR_ID) AS VENDOR_ID, ANY_VALUE(VENDOR_NAME) AS VENDOR_NAME,
           ANY_VALUE(APPROPRIATION_CODE) AS APPROPRIATION_CODE, ANY_VALUE(BUREAU_CODE) AS BUREAU_CODE,
           ROW_NUMBER() OVER (ORDER BY RANDOM()) AS RN
    FROM RAW.GFMS_TRANSACTIONS WHERE OBLIGATION_CEILING IS NOT NULL AND OBLIGATION_CEILING > 0
    GROUP BY OBLIGATION_ID, OBLIGATION_CEILING
    HAVING SUM(PAYMENT_AMOUNT) < OBLIGATION_CEILING AND SUM(PAYMENT_AMOUNT) > OBLIGATION_CEILING * 0.7
)
SELECT 'GFMS-OVER-' || LPAD(RN::VARCHAR, 4, '0'), OBLIGATION_ID, APPROPRIATION_CODE, VENDOR_ID, VENDOR_NAME,
    ROUND((OBLIGATION_CEILING-CURRENT_TOTAL)+UNIFORM(5000,50000,RANDOM()), 2), OBLIGATION_CEILING,
    DATEADD(DAY, UNIFORM(1,60,RANDOM()), '2025-06-01'::DATE),
    'Additional contract services - supplemental', 'CTR-' || LPAD(UNIFORM(1000,9999,RANDOM())::VARCHAR, 4, '0'), BUREAU_CODE
FROM over_obligations WHERE RN <= 10;

-- ANOMALY 4: Time/Pay Mismatches (10 employees on 4 weeks leave)
UPDATE RAW.GTA_TIME_ATTENDANCE SET STATUS_CODE = 'ANNUAL_LEAVE', HOURS_CLAIMED = 0.0
WHERE EMPLOYEE_ID IN (SELECT EMPLOYEE_ID FROM (SELECT DISTINCT EMPLOYEE_ID, ROW_NUMBER() OVER (ORDER BY RANDOM()) AS RN
    FROM RAW.GTA_TIME_ATTENDANCE WHERE STATUS_CODE = 'REGULAR') WHERE RN <= 10)
AND RECORD_DATE BETWEEN '2025-03-01' AND '2025-03-28';

-- ANOMALY 5: Debarred Vendor Payments (3 GFMS + 3 RFMS)
INSERT INTO RAW.GFMS_TRANSACTIONS
SELECT 'GFMS-DEBAR-' || LPAD(ROW_NUMBER() OVER (ORDER BY RANDOM())::VARCHAR, 4, '0'),
    'OBL-' || LPAD(UNIFORM(2501,3000,RANDOM())::VARCHAR, 5, '0'), '19-0301/0305',
    dv.VENDOR_ID, dv.VENDOR_NAME, ROUND(UNIFORM(15000,85000,RANDOM()), 2), ROUND(UNIFORM(100000,500000,RANDOM()), 2),
    DATEADD(DAY, UNIFORM(30,365,RANDOM()), dv.DEBARMENT_DATE), 'Consulting and professional services',
    'CTR-' || LPAD(UNIFORM(5000,5999,RANDOM())::VARCHAR, 4, '0'), 'DS'
FROM (SELECT *, ROW_NUMBER() OVER (ORDER BY RANDOM()) AS RN FROM RAW.DEBARRED_VENDORS) dv WHERE RN <= 3;

INSERT INTO RAW.RFMS_TRANSACTIONS
SELECT 'RFMS-DEBAR-' || LPAD(ROW_NUMBER() OVER (ORDER BY RANDOM())::VARCHAR, 4, '0'),
    'OBL-' || LPAD(UNIFORM(2501,3000,RANDOM())::VARCHAR, 5, '0'), 'NAIROBI',
    dv.VENDOR_ID, dv.VENDOR_NAME, ROUND(UNIFORM(10000,65000,RANDOM()), 2),
    DATEADD(DAY, UNIFORM(30,365,RANDOM()), dv.DEBARMENT_DATE), 'Security services and equipment',
    'CTR-' || LPAD(UNIFORM(6000,6999,RANDOM())::VARCHAR, 4, '0'), 'USD'
FROM (SELECT *, ROW_NUMBER() OVER (ORDER BY RANDOM()) AS RN FROM RAW.DEBARRED_VENDORS) dv WHERE RN BETWEEN 4 AND 6;

-- ANOMALY 6: Statistical Outliers (13 RFMS payments at 3-5x typical)
INSERT INTO RAW.RFMS_TRANSACTIONS
SELECT 'RFMS-OUTLIER-' || LPAD(ROW_NUMBER() OVER (ORDER BY POST_ID)::VARCHAR, 4, '0'),
    'OBL-' || LPAD(UNIFORM(2001,2500,RANDOM())::VARCHAR, 5, '0'),
    POST_ID, VENDOR_ID, VENDOR_NAME, ROUND(AVG_AMT*(3+UNIFORM(0,200,RANDOM())/100.0), 2),
    DATEADD(DAY, UNIFORM(0,365,RANDOM()), '2024-10-01'::DATE),
    'Emergency procurement - expedited delivery', NULL, CURRENCY_CODE
FROM (SELECT POST_ID, ROUND(AVG(PAYMENT_AMOUNT), 2) AS AVG_AMT,
    ANY_VALUE(VENDOR_ID) AS VENDOR_ID, ANY_VALUE(VENDOR_NAME) AS VENDOR_NAME,
    ANY_VALUE(CURRENCY_CODE) AS CURRENCY_CODE
    FROM RAW.RFMS_TRANSACTIONS GROUP BY POST_ID ORDER BY RANDOM() LIMIT 13);

-- ANOMALY 7: Split Payments (8 obligations x 5 splits = 40 payments below $10K)
INSERT INTO RAW.GFMS_TRANSACTIONS
WITH split_base AS (
    SELECT 'GFMS-SPLIT-' || LPAD(((o.OBL_NUM-1)*5+s.SPLIT_NUM)::VARCHAR, 4, '0') AS TRANSACTION_ID,
        'OBL-SPLIT-' || LPAD(o.OBL_NUM::VARCHAR, 3, '0') AS OBLIGATION_ID, '19-0601/0605' AS APPROPRIATION_CODE,
        'V-10' || LPAD((40+o.OBL_NUM)::VARCHAR, 2, '0') AS VENDOR_ID,
        CASE o.OBL_NUM WHEN 1 THEN 'Capitol Consulting Group' WHEN 2 THEN 'Bravura Information Technology'
            WHEN 3 THEN 'Credence Management Solutions' WHEN 4 THEN 'Definitive Logic'
            WHEN 5 THEN 'Eastern Research Group' WHEN 6 THEN 'Federal Management Partners'
            WHEN 7 THEN 'Grant Thornton LLP' WHEN 8 THEN 'HumanTouch LLC' END AS VENDOR_NAME,
        ROUND(UNIFORM(8500,9900,RANDOM()), 2) AS PAYMENT_AMOUNT, 50000.00 AS OBLIGATION_CEILING,
        DATEADD(DAY, s.SPLIT_NUM*UNIFORM(3,10,RANDOM()), '2025-04-01'::DATE) AS DISBURSEMENT_DATE,
        'Professional services - phase ' || s.SPLIT_NUM::VARCHAR AS DESCRIPTION,
        'CTR-SPLIT-' || LPAD(o.OBL_NUM::VARCHAR, 3, '0') AS CONTRACT_ID, 'PM' AS BUREAU_CODE
    FROM (SELECT SEQ4()+1 AS OBL_NUM FROM TABLE(GENERATOR(ROWCOUNT => 8))) o
    CROSS JOIN (SELECT SEQ4()+1 AS SPLIT_NUM FROM TABLE(GENERATOR(ROWCOUNT => 5))) s
)
SELECT * FROM split_base WHERE VENDOR_NAME IS NOT NULL;

SELECT 'Synthetic data generation complete' AS STATUS;
