-- Create persons table for non-auth users (suppliers, contractors, etc.)
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS persons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL, -- Use same ENUM as profiles
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_persons_active ON persons(is_active);
CREATE INDEX IF NOT EXISTS idx_persons_role ON persons(role);

-- Update tender_assignments to support both auth users and persons
ALTER TABLE tender_assignments 
  ADD COLUMN IF NOT EXISTS person_id UUID REFERENCES persons(id) ON DELETE CASCADE;

-- Make user_id nullable (for persons who are not auth users)
ALTER TABLE tender_assignments 
  ALTER COLUMN user_id DROP NOT NULL;

-- Add check constraint: either user_id or person_id must be set
ALTER TABLE tender_assignments DROP CONSTRAINT IF EXISTS check_user_or_person;

ALTER TABLE tender_assignments
  ADD CONSTRAINT check_user_or_person CHECK (
    (user_id IS NOT NULL AND person_id IS NULL) OR
    (user_id IS NULL AND person_id IS NOT NULL)
  );

-- Update advances table to support both auth users and persons
ALTER TABLE advances
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE advances
  ADD COLUMN IF NOT EXISTS person_id UUID;

ALTER TABLE advances
  ALTER COLUMN person_id DROP NOT NULL;

-- Move existing profile-based person_id values into user_id
UPDATE advances
SET user_id = person_id,
    person_id = NULL
WHERE user_id IS NULL
  AND person_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM profiles WHERE id = advances.person_id)
  AND NOT EXISTS (SELECT 1 FROM persons WHERE id = advances.person_id);

-- Ensure person_id references persons (drop old FK if it pointed at profiles)
ALTER TABLE advances DROP CONSTRAINT IF EXISTS advances_person_id_fkey;

ALTER TABLE advances
  ADD CONSTRAINT advances_person_id_fkey
  FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE;

ALTER TABLE advances DROP CONSTRAINT IF EXISTS advances_user_id_fkey;

ALTER TABLE advances
  ADD CONSTRAINT advances_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE advances DROP CONSTRAINT IF EXISTS check_advances_user_or_person;

ALTER TABLE advances
  ADD CONSTRAINT check_advances_user_or_person CHECK (
    (user_id IS NOT NULL AND person_id IS NULL) OR
    (user_id IS NULL AND person_id IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS idx_advances_user ON advances(user_id);
CREATE INDEX IF NOT EXISTS idx_advances_tender_user ON advances(tender_id, user_id);

-- Update expense_submissions to support persons
ALTER TABLE expense_submissions
  ADD COLUMN IF NOT EXISTS person_id UUID REFERENCES persons(id) ON DELETE CASCADE;

-- Update person_ledgers to support both auth users and persons
ALTER TABLE person_ledgers
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE person_ledgers
  ADD COLUMN IF NOT EXISTS person_id UUID;

ALTER TABLE person_ledgers
  ALTER COLUMN person_id DROP NOT NULL;

-- Move existing profile-based person_id values into user_id
UPDATE person_ledgers
SET user_id = person_id,
    person_id = NULL
WHERE user_id IS NULL
  AND person_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM profiles WHERE id = person_ledgers.person_id)
  AND NOT EXISTS (SELECT 1 FROM persons WHERE id = person_ledgers.person_id);

-- Ensure person_id references persons (drop old FK if it pointed at profiles)
ALTER TABLE person_ledgers DROP CONSTRAINT IF EXISTS person_ledgers_person_id_fkey;

ALTER TABLE person_ledgers
  ADD CONSTRAINT person_ledgers_person_id_fkey
  FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE;

ALTER TABLE person_ledgers DROP CONSTRAINT IF EXISTS person_ledgers_user_id_fkey;

ALTER TABLE person_ledgers
  ADD CONSTRAINT person_ledgers_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE person_ledgers DROP CONSTRAINT IF EXISTS check_person_ledgers_user_or_person;

ALTER TABLE person_ledgers
  ADD CONSTRAINT check_person_ledgers_user_or_person CHECK (
    (user_id IS NOT NULL AND person_id IS NULL) OR
    (user_id IS NULL AND person_id IS NOT NULL)
  );

ALTER TABLE person_ledgers DROP CONSTRAINT IF EXISTS person_ledgers_tender_id_person_id_key;

ALTER TABLE person_ledgers DROP CONSTRAINT IF EXISTS person_ledgers_tender_id_user_id_key;

ALTER TABLE person_ledgers
  ADD CONSTRAINT person_ledgers_tender_id_person_id_key UNIQUE (tender_id, person_id);

ALTER TABLE person_ledgers
  ADD CONSTRAINT person_ledgers_tender_id_user_id_key UNIQUE (tender_id, user_id);

CREATE INDEX IF NOT EXISTS idx_ledgers_user ON person_ledgers(user_id);

-- RLS Policies for persons table
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all persons
DROP POLICY IF EXISTS "Allow authenticated users to read persons" ON persons;
CREATE POLICY "Allow authenticated users to read persons"
  ON persons FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert persons
DROP POLICY IF EXISTS "Allow authenticated users to insert persons" ON persons;
CREATE POLICY "Allow authenticated users to insert persons"
  ON persons FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update persons
DROP POLICY IF EXISTS "Allow authenticated users to update persons" ON persons;
CREATE POLICY "Allow authenticated users to update persons"
  ON persons FOR UPDATE
  TO authenticated
  USING (true);

-- Allow authenticated users to delete persons
DROP POLICY IF EXISTS "Allow authenticated users to delete persons" ON persons;
CREATE POLICY "Allow authenticated users to delete persons"
  ON persons FOR DELETE
  TO authenticated
  USING (true);

-- Create view to get all people (both auth users and persons)
CREATE OR REPLACE VIEW all_people AS
SELECT 
  p.id,
  p.full_name,
  p.role,
  'auth_user' as person_type,
  p.is_active
FROM profiles p
UNION ALL
SELECT 
  ps.id,
  ps.full_name,
  ps.role,
  'person' as person_type,
  ps.is_active
FROM persons ps;

COMMENT ON VIEW all_people IS 'Combined view of auth users and non-auth persons';

-- Balances for a single person (auth user or non-auth person)
CREATE OR REPLACE FUNCTION get_person_balance(
  p_tender_id UUID,
  p_person_id UUID
)
RETURNS TABLE (balance DECIMAL(12,2)) AS $$
DECLARE
  v_advances DECIMAL(12,2);
  v_expenses DECIMAL(12,2);
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO v_advances
  FROM advances
  WHERE tender_id = p_tender_id
    AND (user_id = p_person_id OR person_id = p_person_id);

  SELECT COALESCE(SUM(amount), 0) INTO v_expenses
  FROM expense_submissions
  WHERE tender_id = p_tender_id
    AND status = 'approved'
    AND (submitted_by = p_person_id OR person_id = p_person_id);

  RETURN QUERY SELECT v_advances - v_expenses;
END;
$$ LANGUAGE plpgsql;

-- Balances for all people in a tender
CREATE OR REPLACE FUNCTION get_person_balances(
  p_tender_id UUID
)
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
  WITH assigned AS (
    SELECT
      ta.tender_id,
      ta.user_id,
      ta.person_id,
      ta.role,
      COALESCE(p.full_name, ps.full_name) AS person_name,
      COALESCE(ta.user_id, ta.person_id) AS person_id
    FROM tender_assignments ta
    LEFT JOIN profiles p ON p.id = ta.user_id
    LEFT JOIN persons ps ON ps.id = ta.person_id
    WHERE ta.tender_id = p_tender_id
  ),
  advances_sum AS (
    SELECT tender_id, user_id, person_id, SUM(amount) AS total_advances
    FROM advances
    WHERE tender_id = p_tender_id
    GROUP BY tender_id, user_id, person_id
  ),
  expenses_sum AS (
    SELECT tender_id, submitted_by AS user_id, person_id, SUM(amount) AS total_expenses
    FROM expense_submissions
    WHERE tender_id = p_tender_id AND status = 'approved'
    GROUP BY tender_id, submitted_by, person_id
  )
  SELECT
    a.person_id,
    a.person_name,
    a.role,
    COALESCE(av.total_advances, 0) AS total_advances,
    COALESCE(ex.total_expenses, 0) AS total_expenses,
    COALESCE(av.total_advances, 0) - COALESCE(ex.total_expenses, 0) AS balance
  FROM assigned a
  LEFT JOIN advances_sum av
    ON av.tender_id = a.tender_id
    AND (
      (a.user_id IS NOT NULL AND av.user_id = a.user_id)
      OR (a.person_id IS NOT NULL AND av.person_id = a.person_id)
    )
  LEFT JOIN expenses_sum ex
    ON ex.tender_id = a.tender_id
    AND (
      (a.user_id IS NOT NULL AND ex.user_id = a.user_id)
      OR (a.person_id IS NOT NULL AND ex.person_id = a.person_id)
    );
END;
$$ LANGUAGE plpgsql;

-- Update ledger function to handle users and persons
CREATE OR REPLACE FUNCTION update_person_ledger(
  p_tender_id UUID,
  p_person_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_advances DECIMAL(12,2);
  v_expenses DECIMAL(12,2);
  v_is_user BOOLEAN;
BEGIN
  IF p_person_id IS NULL THEN
    RETURN;
  END IF;

  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = p_person_id) INTO v_is_user;

  SELECT COALESCE(SUM(amount), 0) INTO v_advances
  FROM advances
  WHERE tender_id = p_tender_id
    AND (
      (v_is_user AND user_id = p_person_id)
      OR (NOT v_is_user AND person_id = p_person_id)
    );

  SELECT COALESCE(SUM(amount), 0) INTO v_expenses
  FROM expense_submissions
  WHERE tender_id = p_tender_id
    AND status = 'approved'
    AND (
      (v_is_user AND submitted_by = p_person_id)
      OR (NOT v_is_user AND person_id = p_person_id)
    );

  IF v_is_user THEN
    INSERT INTO person_ledgers (
      tender_id,
      user_id,
      person_id,
      total_advances,
      total_expenses,
      current_balance,
      last_updated
    )
    VALUES (
      p_tender_id,
      p_person_id,
      NULL,
      v_advances,
      v_expenses,
      v_advances - v_expenses,
      NOW()
    )
    ON CONFLICT (tender_id, user_id)
    DO UPDATE SET
      total_advances = v_advances,
      total_expenses = v_expenses,
      current_balance = v_advances - v_expenses,
      last_updated = NOW();
  ELSE
    INSERT INTO person_ledgers (
      tender_id,
      user_id,
      person_id,
      total_advances,
      total_expenses,
      current_balance,
      last_updated
    )
    VALUES (
      p_tender_id,
      NULL,
      p_person_id,
      v_advances,
      v_expenses,
      v_advances - v_expenses,
      NOW()
    )
    ON CONFLICT (tender_id, person_id)
    DO UPDATE SET
      total_advances = v_advances,
      total_expenses = v_expenses,
      current_balance = v_advances - v_expenses,
      last_updated = NOW();
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Update ledger triggers to handle users and persons
CREATE OR REPLACE FUNCTION trigger_update_ledger_advance()
RETURNS TRIGGER AS $$
DECLARE
  v_person_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_person_id := COALESCE(OLD.user_id, OLD.person_id);
    PERFORM update_person_ledger(OLD.tender_id, v_person_id);
  ELSE
    v_person_id := COALESCE(NEW.user_id, NEW.person_id);
    PERFORM update_person_ledger(NEW.tender_id, v_person_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trigger_update_ledger_expense()
RETURNS TRIGGER AS $$
DECLARE
  v_person_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_person_id := COALESCE(OLD.person_id, OLD.submitted_by);
    PERFORM update_person_ledger(OLD.tender_id, v_person_id);
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    v_person_id := COALESCE(NEW.person_id, NEW.submitted_by);
    PERFORM update_person_ledger(NEW.tender_id, v_person_id);
  ELSIF TG_OP = 'INSERT' THEN
    v_person_id := COALESCE(NEW.person_id, NEW.submitted_by);
    PERFORM update_person_ledger(NEW.tender_id, v_person_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
