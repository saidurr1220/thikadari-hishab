-- Zero-to-one schema reset for THIKADAR-HISHAB (Supabase Postgres)
-- Run in Supabase SQL Editor (will DROP and recreate tables/types)

-- =============================
-- RESET (DANGER)
-- =============================
DROP VIEW IF EXISTS expense_rollup;

DROP TABLE IF EXISTS vendor_payments CASCADE;
DROP TABLE IF EXISTS vendor_purchases CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;
DROP TABLE IF EXISTS vendor_categories CASCADE;
DROP TABLE IF EXISTS person_expenses CASCADE;
DROP TABLE IF EXISTS person_advances CASCADE;
DROP TABLE IF EXISTS persons CASCADE;
DROP TABLE IF EXISTS tender_assignments CASCADE;
DROP TABLE IF EXISTS tenders CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS expense_source CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- =============================
-- EXTENSIONS
-- =============================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================
-- ENUMS
-- =============================
CREATE TYPE user_role AS ENUM (
  'owner',
  'admin',
  'accountant',
  'site_manager',
  'site_engineer',
  'foreman',
  'driver',
  'viewer',
  'supplier'
);

CREATE TYPE payment_method AS ENUM ('cash', 'bank', 'mfs', 'advance');

CREATE TYPE expense_source AS ENUM (
  'vendor_purchase',
  'person_expense',
  'mfs_charge'
);

-- =============================
-- CORE TABLES
-- =============================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'viewer',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tenders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tender_code TEXT NOT NULL UNIQUE,
  project_name TEXT NOT NULL,
  location TEXT,
  client_department TEXT,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenders_active ON tenders(is_active);

CREATE TABLE tender_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  person_id UUID,
  role user_role NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by UUID REFERENCES profiles(id),
  UNIQUE(tender_id, user_id),
  UNIQUE(tender_id, person_id)
);

-- Non-auth people (staff/vendors)
CREATE TABLE persons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

ALTER TABLE tender_assignments
  ADD CONSTRAINT tender_assignment_check CHECK (
    (user_id IS NOT NULL AND person_id IS NULL) OR
    (user_id IS NULL AND person_id IS NOT NULL)
  );

ALTER TABLE tender_assignments
  ADD CONSTRAINT tender_assignments_person_fk
  FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE;

-- =============================
-- VENDORS
-- =============================
CREATE TABLE vendor_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_bn TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES vendor_categories(id),
  name TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_vendors_active ON vendors(is_active);
CREATE INDEX IF NOT EXISTS idx_vendors_category ON vendors(category_id);

CREATE TABLE vendor_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  purchase_date DATE NOT NULL,
  item_name TEXT,
  quantity DECIMAL(12,3),
  unit TEXT,
  unit_price DECIMAL(12,2),
  base_cost DECIMAL(12,2),
  transport_cost DECIMAL(12,2),
  unload_cost DECIMAL(12,2),
  total_cost DECIMAL(12,2) NOT NULL,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_purchases_tender_date
  ON vendor_purchases(tender_id, purchase_date DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_purchases_vendor
  ON vendor_purchases(vendor_id);

CREATE TABLE vendor_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_method payment_method NOT NULL,
  payment_ref TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_payments_tender_date
  ON vendor_payments(tender_id, payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_payments_vendor
  ON vendor_payments(vendor_id);

-- =============================
-- ADVANCES (STAFF/PEOPLE)
-- =============================
CREATE TABLE person_advances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  advance_date DATE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  person_id UUID REFERENCES persons(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  payment_method payment_method NOT NULL,
  payment_ref TEXT,
  purpose TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE person_advances
  ADD CONSTRAINT person_advances_check CHECK (
    (user_id IS NOT NULL AND person_id IS NULL) OR
    (user_id IS NULL AND person_id IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS idx_person_advances_tender_date
  ON person_advances(tender_id, advance_date DESC);

CREATE TABLE person_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  expense_date DATE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  person_id UUID REFERENCES persons(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE person_expenses
  ADD CONSTRAINT person_expenses_check CHECK (
    (user_id IS NOT NULL AND person_id IS NULL) OR
    (user_id IS NULL AND person_id IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS idx_person_expenses_tender_date
  ON person_expenses(tender_id, expense_date DESC);

-- =============================
-- VIEWS & FUNCTIONS
-- =============================
-- All expenses in one place (auto-approved)
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
WHERE pa.payment_method = 'mfs';

-- Vendor balances
CREATE OR REPLACE FUNCTION get_vendor_balances(p_tender_id UUID)
RETURNS TABLE (
  vendor_id UUID,
  vendor_name TEXT,
  category_id UUID,
  total_purchases DECIMAL(12,2),
  total_paid DECIMAL(12,2),
  balance DECIMAL(12,2)
) AS $$
  SELECT
    v.id AS vendor_id,
    v.name AS vendor_name,
    v.category_id,
    COALESCE(SUM(vp.total_cost), 0) AS total_purchases,
    COALESCE(SUM(vpay.amount), 0) AS total_paid,
    COALESCE(SUM(vp.total_cost), 0) - COALESCE(SUM(vpay.amount), 0) AS balance
  FROM vendors v
  LEFT JOIN vendor_purchases vp
    ON vp.vendor_id = v.id AND vp.tender_id = p_tender_id
  LEFT JOIN vendor_payments vpay
    ON vpay.vendor_id = v.id AND vpay.tender_id = p_tender_id
  GROUP BY v.id, v.name, v.category_id;
$$ LANGUAGE sql;

-- Person balances
CREATE OR REPLACE FUNCTION get_person_balances(p_tender_id UUID)
RETURNS TABLE (
  person_id UUID,
  person_name TEXT,
  role user_role,
  total_advances DECIMAL(12,2),
  total_expenses DECIMAL(12,2),
  balance DECIMAL(12,2)
) AS $$
  WITH assigned AS (
    SELECT
      ta.tender_id,
      ta.user_id,
      ta.role,
      COALESCE(p.full_name, ps.full_name) AS person_name,
      COALESCE(ta.user_id, ta.person_id) AS person_id
    FROM tender_assignments ta
    LEFT JOIN profiles p ON p.id = ta.user_id
    LEFT JOIN persons ps ON ps.id = ta.person_id
    WHERE ta.tender_id = p_tender_id
  ),
  adv AS (
    SELECT tender_id, user_id, person_id, SUM(amount) AS total_advances
    FROM person_advances
    WHERE tender_id = p_tender_id
    GROUP BY tender_id, user_id, person_id
  ),
  exp AS (
    SELECT tender_id, user_id, person_id, SUM(amount) AS total_expenses
    FROM person_expenses
    WHERE tender_id = p_tender_id
    GROUP BY tender_id, user_id, person_id
  )
  SELECT
    a.person_id,
    a.person_name,
    a.role,
    COALESCE(ad.total_advances, 0) AS total_advances,
    COALESCE(ex.total_expenses, 0) AS total_expenses,
    COALESCE(ad.total_advances, 0) - COALESCE(ex.total_expenses, 0) AS balance
  FROM assigned a
  LEFT JOIN adv ad
    ON ad.tender_id = a.tender_id
    AND (
      (a.user_id IS NOT NULL AND ad.user_id = a.user_id)
      OR (a.person_id IS NOT NULL AND ad.person_id = a.person_id)
    )
  LEFT JOIN exp ex
    ON ex.tender_id = a.tender_id
    AND (
      (a.user_id IS NOT NULL AND ex.user_id = a.user_id)
      OR (a.person_id IS NOT NULL AND ex.person_id = a.person_id)
    );
$$ LANGUAGE sql;

-- =============================
-- SEED VENDOR CATEGORIES
-- =============================
INSERT INTO vendor_categories (name, name_bn)
VALUES
  ('sand', 'বালু'),
  ('cement', 'সিমেন্ট'),
  ('stone', 'পাথর'),
  ('brick', 'ইট'),
  ('steel', 'রড'),
  ('transport', 'পরিবহন'),
  ('equipment', 'মেশিন ভাড়া'),
  ('service', 'সেবা'),
  ('other', 'অন্যান্য')
ON CONFLICT DO NOTHING;
