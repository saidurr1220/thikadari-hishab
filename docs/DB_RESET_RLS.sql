-- RLS policies for reset schema

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_expenses ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_tender_access(check_tender_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM tender_assignments
    WHERE tender_id = check_tender_id AND user_id = auth.uid()
  ) OR is_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin());

-- Tenders
DROP POLICY IF EXISTS "Users can view assigned tenders" ON tenders;
CREATE POLICY "Users can view assigned tenders"
  ON tenders FOR SELECT
  USING (has_tender_access(id));

DROP POLICY IF EXISTS "Admins can manage tenders" ON tenders;
CREATE POLICY "Admins can manage tenders"
  ON tenders FOR ALL
  USING (is_admin());

-- Tender assignments
DROP POLICY IF EXISTS "Users can view own assignments" ON tender_assignments;
CREATE POLICY "Users can view own assignments"
  ON tender_assignments FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Admins can manage assignments" ON tender_assignments;
CREATE POLICY "Admins can manage assignments"
  ON tender_assignments FOR ALL
  USING (is_admin());

-- Persons
DROP POLICY IF EXISTS "Users can read persons" ON persons;
CREATE POLICY "Users can read persons"
  ON persons FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can manage persons" ON persons;
CREATE POLICY "Users can manage persons"
  ON persons FOR ALL
  TO authenticated
  USING (true);

-- Vendor categories
DROP POLICY IF EXISTS "Users can read vendor categories" ON vendor_categories;
CREATE POLICY "Users can read vendor categories"
  ON vendor_categories FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage vendor categories" ON vendor_categories;
CREATE POLICY "Admins can manage vendor categories"
  ON vendor_categories FOR ALL
  USING (is_admin());

-- Vendors
DROP POLICY IF EXISTS "Users can read vendors" ON vendors;
CREATE POLICY "Users can read vendors"
  ON vendors FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can manage vendors" ON vendors;
CREATE POLICY "Users can manage vendors"
  ON vendors FOR ALL
  USING (true);

-- Vendor purchases
DROP POLICY IF EXISTS "Users can read vendor purchases" ON vendor_purchases;
CREATE POLICY "Users can read vendor purchases"
  ON vendor_purchases FOR SELECT
  USING (has_tender_access(tender_id));

DROP POLICY IF EXISTS "Users can manage vendor purchases" ON vendor_purchases;
CREATE POLICY "Users can manage vendor purchases"
  ON vendor_purchases FOR ALL
  USING (has_tender_access(tender_id));

-- Vendor payments
DROP POLICY IF EXISTS "Users can read vendor payments" ON vendor_payments;
CREATE POLICY "Users can read vendor payments"
  ON vendor_payments FOR SELECT
  USING (has_tender_access(tender_id));

DROP POLICY IF EXISTS "Users can manage vendor payments" ON vendor_payments;
CREATE POLICY "Users can manage vendor payments"
  ON vendor_payments FOR ALL
  USING (has_tender_access(tender_id));

-- Person advances
DROP POLICY IF EXISTS "Users can read person advances" ON person_advances;
CREATE POLICY "Users can read person advances"
  ON person_advances FOR SELECT
  USING (has_tender_access(tender_id));

DROP POLICY IF EXISTS "Users can manage person advances" ON person_advances;
CREATE POLICY "Users can manage person advances"
  ON person_advances FOR ALL
  USING (has_tender_access(tender_id));

-- Person expenses
DROP POLICY IF EXISTS "Users can read person expenses" ON person_expenses;
CREATE POLICY "Users can read person expenses"
  ON person_expenses FOR SELECT
  USING (has_tender_access(tender_id));

DROP POLICY IF EXISTS "Users can manage person expenses" ON person_expenses;
CREATE POLICY "Users can manage person expenses"
  ON person_expenses FOR ALL
  USING (has_tender_access(tender_id));
