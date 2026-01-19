-- Fix MFS charge duplicates and clean up person_expenses table
-- Run this in your Supabase SQL Editor

-- Step 1: Delete all [MFS CHARGE] entries from person_expenses table
-- These should NEVER be in person_expenses, they should only be in activity_expenses table
DELETE FROM person_expenses 
WHERE description LIKE '[MFS CHARGE]%' 
   OR description LIKE '%Transaction fee%';

-- Step 2: Recreate the expense_rollup view with proper filtering
DROP VIEW IF EXISTS expense_rollup CASCADE;

-- First, make sure expense_source type exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_source') THEN
        CREATE TYPE expense_source AS ENUM (
            'vendor_purchase',
            'material_purchase', 
            'labor_entry',
            'activity_expense',
            'mfs_charge',
            'person_expense'
        );
    END IF;
END $$;

CREATE OR REPLACE VIEW expense_rollup AS
-- Vendor purchases
SELECT
  vp.tender_id,
  vp.purchase_date AS entry_date,
  'vendor_purchase'::expense_source AS source_type,
  vp.total_cost AS amount,
  vp.vendor_id,
  NULL::uuid AS person_id,
  COALESCE(vp.item_name, 'Vendor purchase') AS description
FROM vendor_purchases vp

UNION ALL

-- Person expenses (excluding MFS charges - they should never exist but double-check)
SELECT
  pe.tender_id,
  pe.expense_date AS entry_date,
  'person_expense'::expense_source AS source_type,
  pe.amount AS amount,
  NULL::uuid AS vendor_id,
  COALESCE(pe.person_id, pe.user_id) AS person_id,
  pe.description AS description
FROM person_expenses pe
WHERE pe.description NOT LIKE '[MFS CHARGE]%'
  AND pe.description NOT LIKE '%Transaction fee%'

UNION ALL

-- MFS charges from activity_expenses table ONLY
SELECT
  ae.tender_id,
  ae.expense_date AS entry_date,
  'mfs_charge'::expense_source AS source_type,
  ae.amount AS amount,
  NULL::uuid AS vendor_id,
  NULL::uuid AS person_id,
  ae.description AS description
FROM activity_expenses ae
WHERE ae.description LIKE '[MFS CHARGE]%'
   OR ae.notes LIKE '%MFS charge%';

-- Step 3: Verify cleanup
-- Run this separately to check results:
-- SELECT COUNT(*) FROM person_expenses WHERE description LIKE '[MFS CHARGE]%';
-- Should return 0

-- SELECT source_type, COUNT(*) as count, SUM(amount) as total 
-- FROM expense_rollup 
-- GROUP BY source_type 
-- ORDER BY source_type;
