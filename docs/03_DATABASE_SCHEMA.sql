-- Section 3: Data Model - Supabase Postgres Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM (
  'owner',
  'admin',
  'accountant',
  'site_manager',
  'site_engineer',
  'foreman',
  'driver',
  'viewer'
);

CREATE TYPE labor_type AS ENUM ('contract', 'daily');

CREATE TYPE payment_method AS ENUM ('cash', 'bank', 'mfs', 'advance');

CREATE TYPE expense_status AS ENUM ('pending', 'approved', 'rejected');

-- ============================================
-- CORE TABLES
-- ============================================

-- Users (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'viewer',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tenders/Projects
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
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);

CREATE INDEX idx_tenders_active ON tenders(is_active);
CREATE INDEX idx_tenders_code ON tenders(tender_code);

-- Tender User Assignment
CREATE TABLE tender_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by UUID REFERENCES profiles(id),
  UNIQUE(tender_id, user_id)
);

CREATE INDEX idx_tender_assignments_tender ON tender_assignments(tender_id);
CREATE INDEX idx_tender_assignments_user ON tender_assignments(user_id);

-- ============================================
-- MASTER DATA
-- ============================================

-- Materials Master
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  unit TEXT NOT NULL, -- cft, ton, kg, pcs, bag, etc.
  unit_bn TEXT NOT NULL,
  category TEXT, -- cement, steel, sand, aggregate, etc.
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_materials_active ON materials(is_active);
CREATE INDEX idx_materials_category ON materials(category);

-- Work Types (for labor)
CREATE TABLE work_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  category TEXT, -- earthwork, concrete, masonry, etc.
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activity Categories
CREATE TABLE activity_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  parent_id UUID REFERENCES activity_categories(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_categories_parent ON activity_categories(parent_id);

-- ============================================
-- LABOR MODULE
-- ============================================

CREATE TABLE labor_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  labor_type labor_type NOT NULL,
  
  -- Contract/Crew fields
  crew_name TEXT,
  work_type_id UUID REFERENCES work_types(id),
  work_type_custom TEXT,
  headcount INTEGER,
  khoraki_rate_per_head DECIMAL(12,2),
  khoraki_total DECIMAL(12,2),
  wage_total DECIMAL(12,2),
  
  -- Daily labor fields
  labor_name TEXT,
  
  notes TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_labor_tender_date ON labor_entries(tender_id, entry_date DESC);
CREATE INDEX idx_labor_type ON labor_entries(labor_type);
CREATE INDEX idx_labor_work_type ON labor_entries(work_type_id);
CREATE INDEX idx_labor_created_by ON labor_entries(created_by);

-- ============================================
-- MATERIALS MODULE
-- ============================================

CREATE TABLE material_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  purchase_date DATE NOT NULL,
  
  material_id UUID REFERENCES materials(id),
  custom_item_name TEXT,
  unit TEXT NOT NULL,
  quantity DECIMAL(12,3) NOT NULL,
  unit_rate DECIMAL(12,2) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  
  -- Bulk breakdown (for sand/stone)
  is_bulk_breakdown BOOLEAN NOT NULL DEFAULT false,
  base_rate_per_cft DECIMAL(12,2),
  qty_cft DECIMAL(12,3),
  transport_vara_cost DECIMAL(12,2),
  unload_rate_per_cft DECIMAL(12,2),
  base_cost DECIMAL(12,2),
  unload_cost DECIMAL(12,2),
  
  supplier TEXT,
  payment_method payment_method,
  payment_ref TEXT,
  notes TEXT,
  
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_materials_tender_date ON material_purchases(tender_id, purchase_date DESC);
CREATE INDEX idx_materials_material ON material_purchases(material_id);
CREATE INDEX idx_materials_supplier ON material_purchases(supplier);
CREATE INDEX idx_materials_created_by ON material_purchases(created_by);

-- ============================================
-- ACTIVITY/EXPENSE MODULE
-- ============================================

CREATE TABLE activity_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  expense_date DATE NOT NULL,
  
  category_id UUID REFERENCES activity_categories(id),
  subcategory_id UUID REFERENCES activity_categories(id),
  description TEXT NOT NULL,
  
  -- Mini-BOQ style (optional)
  quantity DECIMAL(12,3),
  unit TEXT,
  rate DECIMAL(12,2),
  
  amount DECIMAL(12,2) NOT NULL,
  vendor TEXT,
  payment_method payment_method,
  payment_ref TEXT,
  notes TEXT,
  
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activities_tender_date ON activity_expenses(tender_id, expense_date DESC);
CREATE INDEX idx_activities_category ON activity_expenses(category_id);
CREATE INDEX idx_activities_subcategory ON activity_expenses(subcategory_id);
CREATE INDEX idx_activities_created_by ON activity_expenses(created_by);

-- ============================================
-- ADVANCES & SETTLEMENT MODULE
-- ============================================

CREATE TABLE advances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  advance_date DATE NOT NULL,
  person_id UUID NOT NULL REFERENCES profiles(id),
  person_role user_role,
  amount DECIMAL(12,2) NOT NULL,
  payment_method payment_method NOT NULL,
  payment_ref TEXT,
  purpose TEXT,
  notes TEXT,
  
  given_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_advances_tender_date ON advances(tender_id, advance_date DESC);
CREATE INDEX idx_advances_person ON advances(person_id);
CREATE INDEX idx_advances_tender_person ON advances(tender_id, person_id);

CREATE TABLE expense_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  expense_date DATE NOT NULL,
  submitted_by UUID NOT NULL REFERENCES profiles(id),
  
  category_id UUID REFERENCES activity_categories(id),
  subcategory_id UUID REFERENCES activity_categories(id),
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  
  status expense_status NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expenses_tender_date ON expense_submissions(tender_id, expense_date DESC);
CREATE INDEX idx_expenses_submitted_by ON expense_submissions(submitted_by);
CREATE INDEX idx_expenses_status ON expense_submissions(status);
CREATE INDEX idx_expenses_tender_person ON expense_submissions(tender_id, submitted_by);

-- Person Ledger Summary (materialized for performance)
CREATE TABLE person_ledgers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  opening_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_advances DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_expenses DECIMAL(12,2) NOT NULL DEFAULT 0,
  current_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tender_id, person_id)
);

CREATE INDEX idx_ledgers_tender ON person_ledgers(tender_id);
CREATE INDEX idx_ledgers_person ON person_ledgers(person_id);

-- ============================================
-- ATTACHMENTS/RECEIPTS
-- ============================================

CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  
  -- Polymorphic reference
  entity_type TEXT NOT NULL, -- 'labor', 'material', 'activity', 'advance', 'expense'
  entity_id UUID NOT NULL,
  
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Supabase Storage path
  file_size INTEGER,
  mime_type TEXT,
  
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attachments_entity ON attachments(entity_type, entity_id);
CREATE INDEX idx_attachments_tender ON attachments(tender_id);

-- ============================================
-- AUDIT LOG
-- ============================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'approve', 'reject'
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_tender ON audit_logs(tender_id, created_at DESC);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tenders_updated_at BEFORE UPDATE ON tenders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_labor_updated_at BEFORE UPDATE ON labor_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON material_purchases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activity_expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_advances_updated_at BEFORE UPDATE ON advances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expense_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to update person ledger
CREATE OR REPLACE FUNCTION update_person_ledger(
  p_tender_id UUID,
  p_person_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_advances DECIMAL(12,2);
  v_expenses DECIMAL(12,2);
BEGIN
  -- Calculate totals
  SELECT COALESCE(SUM(amount), 0) INTO v_advances
  FROM advances
  WHERE tender_id = p_tender_id AND person_id = p_person_id;
  
  SELECT COALESCE(SUM(amount), 0) INTO v_expenses
  FROM expense_submissions
  WHERE tender_id = p_tender_id AND submitted_by = p_person_id AND status = 'approved';
  
  -- Upsert ledger
  INSERT INTO person_ledgers (tender_id, person_id, total_advances, total_expenses, current_balance, last_updated)
  VALUES (p_tender_id, p_person_id, v_advances, v_expenses, v_advances - v_expenses, NOW())
  ON CONFLICT (tender_id, person_id)
  DO UPDATE SET
    total_advances = v_advances,
    total_expenses = v_expenses,
    current_balance = v_advances - v_expenses,
    last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger to update ledger on advance insert/update/delete
CREATE OR REPLACE FUNCTION trigger_update_ledger_advance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM update_person_ledger(OLD.tender_id, OLD.person_id);
  ELSE
    PERFORM update_person_ledger(NEW.tender_id, NEW.person_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ledger_on_advance
AFTER INSERT OR UPDATE OR DELETE ON advances
FOR EACH ROW EXECUTE FUNCTION trigger_update_ledger_advance();

-- Trigger to update ledger on expense approval
CREATE OR REPLACE FUNCTION trigger_update_ledger_expense()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM update_person_ledger(OLD.tender_id, OLD.submitted_by);
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    PERFORM update_person_ledger(NEW.tender_id, NEW.submitted_by);
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM update_person_ledger(NEW.tender_id, NEW.submitted_by);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ledger_on_expense
AFTER INSERT OR UPDATE OR DELETE ON expense_submissions
FOR EACH ROW EXECUTE FUNCTION trigger_update_ledger_expense();
