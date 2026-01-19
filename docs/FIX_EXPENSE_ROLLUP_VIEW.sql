-- Fix expense_rollup view to exclude MFS charges from person_expenses
-- and not calculate MFS charges from person_advances (since we now create actual entries)

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

-- MFS charges from main expenses table only
SELECT
  e.tender_id,
  e.expense_date AS entry_date,
  'mfs_charge'::expense_source AS source_type,
  e.amount AS amount,
  NULL::uuid AS vendor_id,
  NULL::uuid AS person_id,
  e.description AS description
FROM expenses e
WHERE e.subcategory = 'mfs_charge'

UNION ALL

-- MFS charges calculated from vendor payments (for backward compatibility)
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
    SELECT 1 FROM expenses e
    WHERE e.tender_id = vp.tender_id
      AND e.expense_date = vp.payment_date
      AND e.subcategory = 'mfs_charge'
      AND ABS(e.amount - (vp.amount * 0.0185 + 10)) < 0.01
  );

-- Summary: 
-- This view now shows:
-- 1. Vendor purchases (as before)
-- 2. Person expenses (but excludes [MFS CHARGE] entries - those stay in staff ledgers only)
-- 3. MFS charges from expenses table (labor, materials, activities, vendor payments)
-- 4. Legacy calculated MFS charges from vendor_payments (if no explicit entry exists)
