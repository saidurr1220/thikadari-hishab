-- Section 4: Supabase Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE labor_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Check if user has role in any tender
CREATE OR REPLACE FUNCTION has_role(check_role user_role)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = check_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is owner/admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has access to tender
CREATE OR REPLACE FUNCTION has_tender_access(check_tender_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM tender_assignments
    WHERE tender_id = check_tender_id AND user_id = auth.uid()
  ) OR is_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has specific role in tender
CREATE OR REPLACE FUNCTION has_tender_role(check_tender_id UUID, check_role user_role)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM tender_assignments
    WHERE tender_id = check_tender_id AND user_id = auth.uid() AND role = check_role
  ) OR is_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can approve (accountant, site_manager, admin, owner)
CREATE OR REPLACE FUNCTION can_approve(check_tender_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM tender_assignments
    WHERE tender_id = check_tender_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'accountant', 'site_manager')
  ) OR is_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- Users can update their own profile (limited fields)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Admins can view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin());

-- Admins can manage all profiles
DROP POLICY IF EXISTS "Admins can manage profiles" ON profiles;
CREATE POLICY "Admins can manage profiles"
  ON profiles FOR ALL
  USING (is_admin());

-- ============================================
-- TENDERS POLICIES
-- ============================================

-- Users can view tenders they're assigned to
DROP POLICY IF EXISTS "Users can view assigned tenders" ON tenders;
CREATE POLICY "Users can view assigned tenders"
  ON tenders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tender_assignments
      WHERE tender_id = tenders.id AND user_id = auth.uid()
    ) OR is_admin()
  );

-- Only admins can create tenders
DROP POLICY IF EXISTS "Admins can create tenders" ON tenders;
CREATE POLICY "Admins can create tenders"
  ON tenders FOR INSERT
  WITH CHECK (is_admin());

-- Only admins can update tenders
DROP POLICY IF EXISTS "Admins can update tenders" ON tenders;
CREATE POLICY "Admins can update tenders"
  ON tenders FOR UPDATE
  USING (is_admin());

-- ============================================
-- TENDER ASSIGNMENTS POLICIES
-- ============================================

-- Users can view their own assignments
DROP POLICY IF EXISTS "Users can view own assignments" ON tender_assignments;
CREATE POLICY "Users can view own assignments"
  ON tender_assignments FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

-- Only admins can manage assignments
DROP POLICY IF EXISTS "Admins can manage assignments" ON tender_assignments;
CREATE POLICY "Admins can manage assignments"
  ON tender_assignments FOR ALL
  USING (is_admin());

-- ============================================
-- MASTER DATA POLICIES (Read-only for most)
-- ============================================

-- Everyone can read master data
DROP POLICY IF EXISTS "All users can view materials" ON materials;
CREATE POLICY "All users can view materials"
  ON materials FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "All users can view work types" ON work_types;
CREATE POLICY "All users can view work types"
  ON work_types FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "All users can view categories" ON activity_categories;
CREATE POLICY "All users can view categories"
  ON activity_categories FOR SELECT
  USING (true);

-- Only admins can modify master data
DROP POLICY IF EXISTS "Admins can manage materials" ON materials;
CREATE POLICY "Admins can manage materials"
  ON materials FOR ALL
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can manage work types" ON work_types;
CREATE POLICY "Admins can manage work types"
  ON work_types FOR ALL
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can manage categories" ON activity_categories;
CREATE POLICY "Admins can manage categories"
  ON activity_categories FOR ALL
  USING (is_admin());

-- ============================================
-- LABOR ENTRIES POLICIES
-- ============================================

-- Users can view labor entries for assigned tenders
DROP POLICY IF EXISTS "Users can view labor in assigned tenders" ON labor_entries;
CREATE POLICY "Users can view labor in assigned tenders"
  ON labor_entries FOR SELECT
  USING (has_tender_access(tender_id));

-- Users can insert labor entries in assigned tenders
DROP POLICY IF EXISTS "Users can insert labor entries" ON labor_entries;
CREATE POLICY "Users can insert labor entries"
  ON labor_entries FOR INSERT
  WITH CHECK (has_tender_access(tender_id));

-- Users can update their own entries, or approvers can update any
DROP POLICY IF EXISTS "Users can update labor entries" ON labor_entries;
CREATE POLICY "Users can update labor entries"
  ON labor_entries FOR UPDATE
  USING (
    (created_by = auth.uid() AND has_tender_access(tender_id))
    OR can_approve(tender_id)
  );

-- Only approvers can delete
DROP POLICY IF EXISTS "Approvers can delete labor entries" ON labor_entries;
CREATE POLICY "Approvers can delete labor entries"
  ON labor_entries FOR DELETE
  USING (can_approve(tender_id));

-- ============================================
-- MATERIAL PURCHASES POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view materials in assigned tenders" ON material_purchases;
CREATE POLICY "Users can view materials in assigned tenders"
  ON material_purchases FOR SELECT
  USING (has_tender_access(tender_id));

DROP POLICY IF EXISTS "Users can insert material purchases" ON material_purchases;
CREATE POLICY "Users can insert material purchases"
  ON material_purchases FOR INSERT
  WITH CHECK (has_tender_access(tender_id));

DROP POLICY IF EXISTS "Users can update material purchases" ON material_purchases;
CREATE POLICY "Users can update material purchases"
  ON material_purchases FOR UPDATE
  USING (
    (created_by = auth.uid() AND has_tender_access(tender_id))
    OR can_approve(tender_id)
  );

DROP POLICY IF EXISTS "Approvers can delete material purchases" ON material_purchases;
CREATE POLICY "Approvers can delete material purchases"
  ON material_purchases FOR DELETE
  USING (can_approve(tender_id));

-- ============================================
-- ACTIVITY EXPENSES POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view activities in assigned tenders" ON activity_expenses;
CREATE POLICY "Users can view activities in assigned tenders"
  ON activity_expenses FOR SELECT
  USING (has_tender_access(tender_id));

DROP POLICY IF EXISTS "Users can insert activity expenses" ON activity_expenses;
CREATE POLICY "Users can insert activity expenses"
  ON activity_expenses FOR INSERT
  WITH CHECK (has_tender_access(tender_id));

DROP POLICY IF EXISTS "Users can update activity expenses" ON activity_expenses;
CREATE POLICY "Users can update activity expenses"
  ON activity_expenses FOR UPDATE
  USING (
    (created_by = auth.uid() AND has_tender_access(tender_id))
    OR can_approve(tender_id)
  );

DROP POLICY IF EXISTS "Approvers can delete activity expenses" ON activity_expenses;
CREATE POLICY "Approvers can delete activity expenses"
  ON activity_expenses FOR DELETE
  USING (can_approve(tender_id));

-- ============================================
-- ADVANCES POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view advances in assigned tenders" ON advances;
CREATE POLICY "Users can view advances in assigned tenders"
  ON advances FOR SELECT
  USING (
    has_tender_access(tender_id)
    OR user_id = auth.uid()
  );

-- Only approvers can give advances
DROP POLICY IF EXISTS "Approvers can give advances" ON advances;
CREATE POLICY "Approvers can give advances"
  ON advances FOR INSERT
  WITH CHECK (can_approve(tender_id));

DROP POLICY IF EXISTS "Approvers can update advances" ON advances;
CREATE POLICY "Approvers can update advances"
  ON advances FOR UPDATE
  USING (can_approve(tender_id));

DROP POLICY IF EXISTS "Approvers can delete advances" ON advances;
CREATE POLICY "Approvers can delete advances"
  ON advances FOR DELETE
  USING (can_approve(tender_id));

-- ============================================
-- EXPENSE SUBMISSIONS POLICIES
-- ============================================

-- Users can view their own submissions or all if approver
DROP POLICY IF EXISTS "Users can view expense submissions" ON expense_submissions;
CREATE POLICY "Users can view expense submissions"
  ON expense_submissions FOR SELECT
  USING (
    submitted_by = auth.uid()
    OR can_approve(tender_id)
  );

-- Users can submit expenses for assigned tenders
DROP POLICY IF EXISTS "Users can submit expenses" ON expense_submissions;
CREATE POLICY "Users can submit expenses"
  ON expense_submissions FOR INSERT
  WITH CHECK (
    has_tender_access(tender_id)
    AND (submitted_by = auth.uid() OR can_approve(tender_id))
  );

-- Users can update their own pending submissions
DROP POLICY IF EXISTS "Users can update own pending expenses" ON expense_submissions;
CREATE POLICY "Users can update own pending expenses"
  ON expense_submissions FOR UPDATE
  USING (
    submitted_by = auth.uid()
    AND status = 'pending'
  );

-- Approvers can update any submission (for approval/rejection)
DROP POLICY IF EXISTS "Approvers can update expense submissions" ON expense_submissions;
CREATE POLICY "Approvers can update expense submissions"
  ON expense_submissions FOR UPDATE
  USING (can_approve(tender_id));

-- Only approvers can delete
DROP POLICY IF EXISTS "Approvers can delete expense submissions" ON expense_submissions;
CREATE POLICY "Approvers can delete expense submissions"
  ON expense_submissions FOR DELETE
  USING (can_approve(tender_id));

-- ============================================
-- PERSON LEDGERS POLICIES
-- ============================================

-- Users can view their own ledger or all if approver
DROP POLICY IF EXISTS "Users can view person ledgers" ON person_ledgers;
CREATE POLICY "Users can view person ledgers"
  ON person_ledgers FOR SELECT
  USING (
    user_id = auth.uid()
    OR has_tender_access(tender_id)
  );

-- System manages ledgers (no direct insert/update/delete by users)
-- But allow for manual corrections by admins
DROP POLICY IF EXISTS "Admins can manage ledgers" ON person_ledgers;
CREATE POLICY "Admins can manage ledgers"
  ON person_ledgers FOR ALL
  USING (is_admin());

-- ============================================
-- ATTACHMENTS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view attachments in assigned tenders" ON attachments;
CREATE POLICY "Users can view attachments in assigned tenders"
  ON attachments FOR SELECT
  USING (has_tender_access(tender_id));

DROP POLICY IF EXISTS "Users can upload attachments" ON attachments;
CREATE POLICY "Users can upload attachments"
  ON attachments FOR INSERT
  WITH CHECK (
    has_tender_access(tender_id)
    AND uploaded_by = auth.uid()
  );

DROP POLICY IF EXISTS "Users can delete own attachments" ON attachments;
CREATE POLICY "Users can delete own attachments"
  ON attachments FOR DELETE
  USING (
    uploaded_by = auth.uid()
    OR can_approve(tender_id)
  );

-- ============================================
-- AUDIT LOGS POLICIES
-- ============================================

-- Users can view audit logs for assigned tenders
DROP POLICY IF EXISTS "Users can view audit logs" ON audit_logs;
CREATE POLICY "Users can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    has_tender_access(tender_id)
    OR is_admin()
  );

-- System creates audit logs (no direct user insert)
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;
CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- ============================================
-- STORAGE POLICIES (Supabase Storage)
-- ============================================

-- Create storage bucket for receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Users can upload receipts" ON storage.objects;
CREATE POLICY "Users can upload receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'receipts'
    AND auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "Users can view receipts in assigned tenders" ON storage.objects;
CREATE POLICY "Users can view receipts in assigned tenders"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'receipts'
    AND auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "Users can delete own receipts" ON storage.objects;
CREATE POLICY "Users can delete own receipts"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
