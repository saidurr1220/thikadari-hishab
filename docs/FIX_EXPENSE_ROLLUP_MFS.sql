-- Fix expense_rollup view to correctly include MFS charges from activity_expenses
-- Run this in Supabase SQL Editor

-- Drop the old view
DROP VIEW IF EXISTS expense_rollup;

-- Recreate the view with correct table reference
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

-- Person expenses (excluding MFS charges that start with [MFS CHARGE])
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

UNION ALL

-- MFS charges from activity_expenses table (where MFS charges are actually stored)
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

UNION ALL

-- MFS charges calculated from vendor payments (for backward compatibility)
-- Only include if no explicit charge entry exists
SELECT
  vp.tender_id,
  vp.payment_date AS entry_date,
  'mfs_charge'::expense_source AS source_type,
  (vp.amount * 0.0185 + 10) AS amount,
  vp.vendor_id,
  NULL::uuid AS person_id,
  'Bkash charge (Vendor)' AS description
FROM vendor_payments vp
WHERE vp.payment_method = 'mfs'
  -- Only include if no explicit charge entry exists
  AND NOT EXISTS (
    SELECT 1 FROM activity_expenses ae
    WHERE ae.tender_id = vp.tender_id
      AND ae.expense_date = vp.payment_date
      AND ae.description LIKE '[MFS CHARGE]%'
      AND ABS(ae.amount - (vp.amount * 0.0185 + 10)) < 0.01
  );
