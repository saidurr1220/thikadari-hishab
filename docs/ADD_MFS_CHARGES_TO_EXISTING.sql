-- Script to add MFS charges for existing person_advances with MFS payment method
-- This creates expense entries in person_expenses table for each MFS advance

-- Insert MFS charges for existing advances
INSERT INTO person_expenses (
  tender_id,
  expense_date,
  description,
  amount,
  notes,
  created_by,
  user_id,
  person_id
)
SELECT 
  pa.tender_id,
  pa.advance_date as expense_date,
  '[MFS CHARGE] Transaction fee for ৳' || pa.amount::text || ' advance' as description,
  (pa.amount * 0.0185 + 10) as amount, -- 1.85% + ৳10
  'Auto-generated: 1.85% + ৳10 MFS charge (retroactive)' as notes,
  pa.created_by,
  pa.user_id,
  pa.person_id
FROM person_advances pa
WHERE 
  pa.payment_method = 'mfs'
  -- Only add if charge entry doesn't already exist
  AND NOT EXISTS (
    SELECT 1 
    FROM person_expenses pe 
    WHERE pe.tender_id = pa.tender_id
      AND pe.expense_date = pa.advance_date
      AND pe.description LIKE '[MFS CHARGE]%'
      AND pe.amount = (pa.amount * 0.0185 + 10)
      AND (
        (pe.user_id = pa.user_id AND pa.user_id IS NOT NULL)
        OR 
        (pe.person_id = pa.person_id AND pa.person_id IS NOT NULL)
      )
  );

-- Display summary of charges added
SELECT 
  COUNT(*) as charges_added,
  SUM(amount * 0.0185 + 10) as total_charge_amount
FROM person_advances
WHERE payment_method = 'mfs'
  AND NOT EXISTS (
    SELECT 1 
    FROM person_expenses pe 
    WHERE pe.tender_id = person_advances.tender_id
      AND pe.expense_date = person_advances.advance_date
      AND pe.description LIKE '[MFS CHARGE]%'
      AND (
        (pe.user_id = person_advances.user_id AND person_advances.user_id IS NOT NULL)
        OR 
        (pe.person_id = person_advances.person_id AND person_advances.person_id IS NOT NULL)
      )
  );
