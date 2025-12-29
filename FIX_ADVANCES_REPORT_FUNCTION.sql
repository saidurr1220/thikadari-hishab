-- Fix get_person_balances to show ALL people with advances/expenses
-- Not just those assigned to the tender
-- This ensures the advances report shows all data

DROP FUNCTION IF EXISTS get_person_balances(UUID);

CREATE OR REPLACE FUNCTION get_person_balances(p_tender_id UUID)
RETURNS TABLE (
  person_id UUID,
  person_name TEXT,
  role user_role,
  total_advances DECIMAL(12,2),
  total_expenses DECIMAL(12,2),
  balance DECIMAL(12,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH 
  -- Get all people with advances
  people_with_advances AS (
    SELECT 
      COALESCE(pa.user_id, pa.person_id) as pid,
      COALESCE(p.full_name, ps.full_name) as name,
      ta.role as person_role
    FROM person_advances pa
    LEFT JOIN profiles p ON p.id = pa.user_id
    LEFT JOIN persons ps ON ps.id = pa.person_id
    LEFT JOIN tender_assignments ta ON ta.tender_id = pa.tender_id 
      AND (
        (ta.user_id IS NOT NULL AND ta.user_id = pa.user_id)
        OR (ta.person_id IS NOT NULL AND ta.person_id = pa.person_id)
      )
    WHERE pa.tender_id = p_tender_id
    GROUP BY COALESCE(pa.user_id, pa.person_id), COALESCE(p.full_name, ps.full_name), ta.role
  ),
  -- Get all people with expenses
  people_with_expenses AS (
    SELECT 
      COALESCE(pe.user_id, pe.person_id) as pid,
      COALESCE(p.full_name, ps.full_name) as name,
      ta.role as person_role
    FROM person_expenses pe
    LEFT JOIN profiles p ON p.id = pe.user_id
    LEFT JOIN persons ps ON ps.id = pe.person_id
    LEFT JOIN tender_assignments ta ON ta.tender_id = pe.tender_id 
      AND (
        (ta.user_id IS NOT NULL AND ta.user_id = pe.user_id)
        OR (ta.person_id IS NOT NULL AND ta.person_id = pe.person_id)
      )
    WHERE pe.tender_id = p_tender_id
    GROUP BY COALESCE(pe.user_id, pe.person_id), COALESCE(p.full_name, ps.full_name), ta.role
  ),
  -- Combine all unique people
  all_people AS (
    SELECT pid, name, person_role FROM people_with_advances
    UNION
    SELECT pid, name, person_role FROM people_with_expenses
  ),
  -- Calculate advance totals
  advance_totals AS (
    SELECT 
      COALESCE(pa.user_id, pa.person_id) AS pid,
      SUM(pa.amount) AS total_adv
    FROM person_advances pa
    WHERE pa.tender_id = p_tender_id
    GROUP BY COALESCE(pa.user_id, pa.person_id)
  ),
  -- Calculate expense totals
  expense_totals AS (
    SELECT 
      COALESCE(pe.user_id, pe.person_id) AS pid,
      SUM(pe.amount) AS total_exp
    FROM person_expenses pe
    WHERE pe.tender_id = p_tender_id
    GROUP BY COALESCE(pe.user_id, pe.person_id)
  )
  SELECT 
    ap.pid,
    ap.name,
    ap.person_role,
    COALESCE(adv.total_adv, 0) AS total_advances,
    COALESCE(exp.total_exp, 0) AS total_expenses,
    COALESCE(adv.total_adv, 0) - COALESCE(exp.total_exp, 0) AS balance
  FROM all_people ap
  LEFT JOIN advance_totals adv ON adv.pid = ap.pid
  LEFT JOIN expense_totals exp ON exp.pid = ap.pid
  ORDER BY ap.name;
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT * FROM get_person_balances('b7ea3020-5ebc-4601-87bb-16ece04ee68c');
