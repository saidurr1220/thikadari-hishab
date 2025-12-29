-- Fix ALL Jalal vendor payments - no MFS charges were applied

-- Step 1: Find ALL Jalal payments with MFS
SELECT 
  vp.id,
  vp.payment_date,
  vp.amount,
  v.name,
  vp.payment_method,
  vp.notes
FROM vendor_payments vp
JOIN vendors v ON v.id = vp.vendor_id
WHERE (v.name LIKE '%জালাল%' OR v.name LIKE '%বেকু%')
  AND vp.payment_method = 'mfs'
ORDER BY vp.payment_date DESC;

-- Step 2: Update ALL Jalal MFS payments to exclude charges
UPDATE vendor_payments 
SET include_mfs_charge = FALSE 
WHERE vendor_id = (
  SELECT id FROM vendors 
  WHERE name LIKE '%জালাল%' 
    OR name LIKE '%বেকু%'
  LIMIT 1
)
AND payment_method = 'mfs';

-- Step 3: Verify - should show NO charges for Jalal
SELECT * FROM expense_rollup 
WHERE source_type = 'mfs_charge' 
  AND vendor_id = (
    SELECT id FROM vendors 
    WHERE name LIKE '%জালাল%' 
      OR name LIKE '%বেকু%'
    LIMIT 1
  );
