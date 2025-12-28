-- Update all payment methods for vendor Jalal to MFS (bKash)
-- Vendor ID: d00a16a6-0bd2-4947-b6d1-c0a930ad53fe

-- Update vendor_purchases (material purchases from this vendor)
UPDATE vendor_purchases
SET payment_method = 'mfs'
WHERE vendor_id = 'd00a16a6-0bd2-4947-b6d1-c0a930ad53fe';

-- Update material_purchases (if vendor is linked)
UPDATE material_purchases
SET payment_method = 'mfs'
WHERE vendor_id = 'd00a16a6-0bd2-4947-b6d1-c0a930ad53fe';

-- Update vendor_payments (manual payments)
UPDATE vendor_payments
SET payment_method = 'mfs'
WHERE vendor_id = 'd00a16a6-0bd2-4947-b6d1-c0a930ad53fe';

-- Verify the updates
SELECT 'vendor_purchases' as table_name, count(*) as updated_count
FROM vendor_purchases
WHERE vendor_id = 'd00a16a6-0bd2-4947-b6d1-c0a930ad53fe'
  AND payment_method = 'mfs'
UNION ALL
SELECT 'material_purchases', count(*)
FROM material_purchases
WHERE vendor_id = 'd00a16a6-0bd2-4947-b6d1-c0a930ad53fe'
  AND payment_method = 'mfs'
UNION ALL
SELECT 'vendor_payments', count(*)
FROM vendor_payments
WHERE vendor_id = 'd00a16a6-0bd2-4947-b6d1-c0a930ad53fe'
  AND payment_method = 'mfs';
