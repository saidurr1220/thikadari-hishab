-- Add flag to control whether MFS charges should be calculated
-- Some payments are made without passing the charge to the expense

ALTER TABLE vendor_payments 
ADD COLUMN IF NOT EXISTS include_mfs_charge BOOLEAN DEFAULT TRUE;

ALTER TABLE person_advances 
ADD COLUMN IF NOT EXISTS include_mfs_charge BOOLEAN DEFAULT TRUE;

-- Update the expense_rollup view to respect the flag
CREATE OR REPLACE VIEW expense_rollup AS
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
SELECT
  pe.tender_id,
  pe.expense_date AS entry_date,
  'person_expense'::expense_source AS source_type,
  pe.amount AS amount,
  NULL::uuid AS vendor_id,
  COALESCE(pe.person_id, pe.user_id) AS person_id,
  pe.description AS description
FROM person_expenses pe
UNION ALL
SELECT
  vp.tender_id,
  vp.payment_date AS entry_date,
  'mfs_charge'::expense_source AS source_type,
  (vp.amount * 0.0185 + 10) AS amount,
  vp.vendor_id,
  NULL::uuid AS person_id,
  'Bkash charge' AS description
FROM vendor_payments vp
WHERE vp.payment_method = 'mfs' 
  AND vp.include_mfs_charge = TRUE  -- Only include charges where flag is true
UNION ALL
SELECT
  pa.tender_id,
  pa.advance_date AS entry_date,
  'mfs_charge'::expense_source AS source_type,
  (pa.amount * 0.0185 + 10) AS amount,
  NULL::uuid AS vendor_id,
  COALESCE(pa.person_id, pa.user_id) AS person_id,
  'Bkash charge' AS description
FROM person_advances pa
WHERE pa.payment_method = 'mfs'
  AND pa.include_mfs_charge = TRUE;  -- Only include charges where flag is true

-- To exclude charges for specific payment (e.g., the Jalal payment):
-- UPDATE vendor_payments 
-- SET include_mfs_charge = FALSE 
-- WHERE vendor_id = (SELECT id FROM vendors WHERE name LIKE '%জালাল%')
--   AND payment_date = '2024-XX-XX'  -- Replace with actual date
--   AND amount = 20000;
