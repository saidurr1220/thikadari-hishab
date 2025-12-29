-- Diagnose why advances report shows no data for tender b7ea3020-5ebc-4601-87bb-16ece04ee68c

-- 1. Check if tender exists
SELECT * FROM tenders WHERE id = 'b7ea3020-5ebc-4601-87bb-16ece04ee68c';

-- 2. Check if there are any person_advances for this tender
SELECT 
  pa.id,
  pa.advance_date,
  pa.amount,
  pa.user_id,
  pa.person_id,
  COALESCE(p.full_name, ps.full_name) as person_name
FROM person_advances pa
LEFT JOIN profiles p ON p.id = pa.user_id
LEFT JOIN persons ps ON ps.id = pa.person_id
WHERE pa.tender_id = 'b7ea3020-5ebc-4601-87bb-16ece04ee68c'
ORDER BY pa.advance_date DESC;

-- 3. Check tender_assignments for this tender
SELECT 
  ta.id,
  ta.user_id,
  ta.person_id,
  ta.role,
  COALESCE(p.full_name, ps.full_name) as person_name
FROM tender_assignments ta
LEFT JOIN profiles p ON p.id = ta.user_id
LEFT JOIN persons ps ON ps.id = ta.person_id
WHERE ta.tender_id = 'b7ea3020-5ebc-4601-87bb-16ece04ee68c';

-- 4. Check if there are advances for people NOT in tender_assignments
SELECT 
  DISTINCT
  COALESCE(pa.user_id, pa.person_id) as person_id,
  COALESCE(p.full_name, ps.full_name) as person_name,
  'Has advances but not assigned' as issue
FROM person_advances pa
LEFT JOIN profiles p ON p.id = pa.user_id
LEFT JOIN persons ps ON ps.id = pa.person_id
WHERE pa.tender_id = 'b7ea3020-5ebc-4601-87bb-16ece04ee68c'
  AND NOT EXISTS (
    SELECT 1 FROM tender_assignments ta
    WHERE ta.tender_id = pa.tender_id
      AND (
        (ta.user_id IS NOT NULL AND ta.user_id = pa.user_id)
        OR (ta.person_id IS NOT NULL AND ta.person_id = pa.person_id)
      )
  );

-- 5. Test the current get_person_balances function
SELECT * FROM get_person_balances('b7ea3020-5ebc-4601-87bb-16ece04ee68c');

-- 6. Get all advances with balances (regardless of assignment)
WITH adv AS (
  SELECT 
    COALESCE(pa.user_id, pa.person_id) as person_id,
    COALESCE(p.full_name, ps.full_name) as person_name,
    SUM(pa.amount) AS total_advances
  FROM person_advances pa
  LEFT JOIN profiles p ON p.id = pa.user_id
  LEFT JOIN persons ps ON ps.id = pa.person_id
  WHERE pa.tender_id = 'b7ea3020-5ebc-4601-87bb-16ece04ee68c'
  GROUP BY COALESCE(pa.user_id, pa.person_id), COALESCE(p.full_name, ps.full_name)
),
exp AS (
  SELECT 
    COALESCE(pe.user_id, pe.person_id) as person_id,
    SUM(pe.amount) AS total_expenses
  FROM person_expenses pe
  WHERE pe.tender_id = 'b7ea3020-5ebc-4601-87bb-16ece04ee68c'
  GROUP BY COALESCE(pe.user_id, pe.person_id)
)
SELECT
  adv.person_id,
  adv.person_name,
  COALESCE(adv.total_advances, 0) as total_advances,
  COALESCE(exp.total_expenses, 0) as total_expenses,
  COALESCE(adv.total_advances, 0) - COALESCE(exp.total_expenses, 0) as balance
FROM adv
LEFT JOIN exp ON exp.person_id = adv.person_id
ORDER BY adv.person_name;
