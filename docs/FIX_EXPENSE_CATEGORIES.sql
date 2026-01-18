-- Fix Expense Categories Structure
-- Run this in Supabase SQL Editor

-- Create expense_categories table (main categories)
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expense_categories_active ON expense_categories(is_active);

-- Create expense_subcategories table
CREATE TABLE IF NOT EXISTS expense_subcategories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES expense_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expense_subcategories_category ON expense_subcategories(category_id);
CREATE INDEX idx_expense_subcategories_active ON expense_subcategories(is_active);

-- RLS Policies
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read expense_categories"
  ON expense_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read expense_subcategories"
  ON expense_subcategories FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- SEED DATA - Construction Site Expense Categories
-- ============================================

-- Main Categories
INSERT INTO expense_categories (name, name_bn, description) VALUES
('Equipment Rental', 'যন্ত্রপাতি ভাড়া', 'Heavy equipment and machinery rental'),
('Transport', 'পরিবহন', 'Transportation and vehicle costs'),
('Concrete Works', 'কংক্রিট কাজ', 'Concrete related work expenses'),
('Earthwork', 'মাটির কাজ', 'Excavation, filling, compaction'),
('Road Works', 'রাস্তার কাজ', 'Road construction and maintenance'),
('Formwork & Scaffolding', 'ফর্মওয়ার্ক ও মাচা', 'Shuttering, centering, scaffolding'),
('Safety & PPE', 'নিরাপত্তা সামগ্রী', 'Safety equipment and PPE'),
('Tools & Equipment', 'টুলস ও সরঞ্জাম', 'Small tools and equipment'),
('Utilities', 'ইউটিলিটি', 'Electricity, water, fuel'),
('Overhead', 'ওভারহেড খরচ', 'General overhead expenses'),
('Site Facilities', 'সাইট সুবিধা', 'Site office, storage, etc.'),
('Professional Services', 'পেশাদার সেবা', 'Consultancy, testing, etc.'),
('Miscellaneous', 'বিবিধ', 'Other miscellaneous expenses')
ON CONFLICT DO NOTHING;

-- Subcategories for Equipment Rental
INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Excavator/Vekku', 'এক্সকাভেটর/ভেকু', 'Excavator rental with operator'
FROM expense_categories WHERE name = 'Equipment Rental';

INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Backhoe Loader', 'ব্যাকহো লোডার', 'Backhoe loader rental'
FROM expense_categories WHERE name = 'Equipment Rental';

INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Roller', 'রোলার', 'Road roller rental'
FROM expense_categories WHERE name = 'Equipment Rental';

INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Concrete Mixer', 'কংক্রিট মিক্সার', 'Concrete mixer machine'
FROM expense_categories WHERE name = 'Equipment Rental';

INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Generator', 'জেনারেটর', 'Power generator rental'
FROM expense_categories WHERE name = 'Equipment Rental';

INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Water Pump', 'পানির পাম্প', 'Dewatering pump'
FROM expense_categories WHERE name = 'Equipment Rental';

INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Vibrator', 'ভাইব্রেটর', 'Concrete vibrator'
FROM expense_categories WHERE name = 'Equipment Rental';

INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Compactor', 'কম্প্যাক্টর', 'Soil compactor'
FROM expense_categories WHERE name = 'Equipment Rental';

-- Subcategories for Transport
INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Dump Truck', 'ডাম্প ট্রাক', 'Dump truck hire'
FROM expense_categories WHERE name = 'Transport';

INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Pickup/Covered Van', 'পিকআপ/কভার্ড ভ্যান', 'Pickup or covered van'
FROM expense_categories WHERE name = 'Transport';

INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Tractor', 'ট্রাক্টর', 'Tractor with trolley'
FROM expense_categories WHERE name = 'Transport';

INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Truck', 'ট্রাক', 'Large truck'
FROM expense_categories WHERE name = 'Transport';

INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Fuel Cost', 'জ্বালানি খরচ', 'Diesel, petrol costs'
FROM expense_categories WHERE name = 'Transport';

-- Subcategories for Concrete Works
INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Guide Wall', 'গাইড ওয়াল', 'Guide wall construction'
FROM expense_categories WHERE name = 'Concrete Works';

INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Foundation', 'ভিত্তি', 'Foundation work'
FROM expense_categories WHERE name = 'Concrete Works';

INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Column', 'কলাম', 'Column casting'
FROM expense_categories WHERE name = 'Concrete Works';

INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Beam', 'বিম', 'Beam casting'
FROM expense_categories WHERE name = 'Concrete Works';

INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Slab', 'স্ল্যাব', 'Slab casting'
FROM expense_categories WHERE name = 'Concrete Works';

INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Curing', 'কিউরিং', 'Concrete curing'
FROM expense_categories WHERE name = 'Concrete Works';

-- Subcategories for Earthwork
INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Excavation', 'খনন/মাটি কাটা', 'Earth excavation'
FROM expense_categories WHERE name = 'Earthwork';

INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Filling', 'ভরাট', 'Earth filling'
FROM expense_categories WHERE name = 'Earthwork';

INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Compaction', 'কম্প্যাকশন', 'Soil compaction'
FROM expense_categories WHERE name = 'Earthwork';

INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Soil Removal', 'মাটি অপসারণ', 'Soil disposal'
FROM expense_categories WHERE name = 'Earthwork';

-- Subcategories for Road Works
INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Sub-base', 'সাব-বেস', 'Sub-base layer'
FROM expense_categories WHERE name = 'Road Works';

INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Base Course', 'বেস কোর্স', 'Base course layer'
FROM expense_categories WHERE name = 'Road Works';

INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Bitumen Work', 'বিটুমিন কাজ', 'Bitumen/asphalt work'
FROM expense_categories WHERE name = 'Road Works';

INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Brick Soling', 'ইটের সলিং', 'Brick soling work'
FROM expense_categories WHERE name = 'Road Works';

-- Subcategories for Formwork & Scaffolding
INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Shuttering Material', 'শাটারিং সামগ্রী', 'Formwork materials'
FROM expense_categories WHERE name = 'Formwork & Scaffolding';

INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Scaffolding', 'মাচা', 'Scaffolding rental'
FROM expense_categories WHERE name = 'Formwork & Scaffolding';

INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Props & Supports', 'প্রপস ও সাপোর্ট', 'Props and supports'
FROM expense_categories WHERE name = 'Formwork & Scaffolding';

-- Subcategories for Safety & PPE
INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Helmets', 'হেলমেট', 'Safety helmets'
FROM expense_categories WHERE name = 'Safety & PPE';

INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Safety Boots', 'সেফটি বুট', 'Safety boots'
FROM expense_categories WHERE name = 'Safety & PPE';

INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Safety Net', 'সেফটি নেট', 'Safety nets'
FROM expense_categories WHERE name = 'Safety & PPE';

INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Gloves', 'গ্লাভস', 'Work gloves'
FROM expense_categories WHERE name = 'Safety & PPE';

INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'First Aid', 'প্রাথমিক চিকিৎসা', 'First aid supplies'
FROM expense_categories WHERE name = 'Safety & PPE';

-- Subcategories for Tools & Equipment
INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Hand Tools', 'হাতের টুলস', 'Hand tools purchase/repair'
FROM expense_categories WHERE name = 'Tools & Equipment';

INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Power Tools', 'পাওয়ার টুলস', 'Power tools'
FROM expense_categories WHERE name = 'Tools & Equipment';

INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Measuring Instruments', 'মাপার যন্ত্র', 'Measuring tools'
FROM expense_categories WHERE name = 'Tools & Equipment';

INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Tool Repair', 'টুলস মেরামত', 'Tool maintenance and repair'
FROM expense_categories WHERE name = 'Tools & Equipment';

-- Subcategories for Utilities
INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Electricity Bill', 'বিদ্যুৎ বিল', 'Electricity charges'
FROM expense_categories WHERE name = 'Utilities';

INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Water Bill', 'পানির বিল', 'Water charges'
FROM expense_categories WHERE name = 'Utilities';

INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Diesel/Fuel', 'ডিজেল/জ্বালানি', 'Fuel for generators'
FROM expense_categories WHERE name = 'Utilities';

-- Subcategories for Overhead
INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Tea & Snacks', 'চা-নাস্তা', 'Tea and snacks for workers'
FROM expense_categories WHERE name = 'Overhead';

INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Mobile Bill', 'মোবাইল বিল', 'Mobile phone bills'
FROM expense_categories WHERE name = 'Overhead';

INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Office Supplies', 'অফিস সামগ্রী', 'Stationery and supplies'
FROM expense_categories WHERE name = 'Overhead';

INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Minor Repairs', 'ক্ষুদ্র মেরামত', 'Small repairs and maintenance'
FROM expense_categories WHERE name = 'Overhead';

INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Cleaning', 'পরিষ্কার-পরিচ্ছন্নতা', 'Site cleaning'
FROM expense_categories WHERE name = 'Overhead';

-- Subcategories for Site Facilities
INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Site Office', 'সাইট অফিস', 'Site office expenses'
FROM expense_categories WHERE name = 'Site Facilities';

INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Storage Shed', 'স্টোরেজ শেড', 'Material storage'
FROM expense_categories WHERE name = 'Site Facilities';

INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Toilet Facilities', 'টয়লেট সুবিধা', 'Toilet maintenance'
FROM expense_categories WHERE name = 'Site Facilities';

INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Security', 'নিরাপত্তা', 'Security guard costs'
FROM expense_categories WHERE name = 'Site Facilities';

-- Subcategories for Professional Services
INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Soil Testing', 'মাটি পরীক্ষা', 'Soil test charges'
FROM expense_categories WHERE name = 'Professional Services';

INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Concrete Testing', 'কংক্রিট পরীক্ষা', 'Concrete test charges'
FROM expense_categories WHERE name = 'Professional Services';

INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Survey', 'সার্ভে', 'Land survey charges'
FROM expense_categories WHERE name = 'Professional Services';

INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Consultancy', 'পরামর্শ সেবা', 'Consultant fees'
FROM expense_categories WHERE name = 'Professional Services';

-- Subcategories for Miscellaneous
INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Permits & Licenses', 'পারমিট ও লাইসেন্স', 'Government permits'
FROM expense_categories WHERE name = 'Miscellaneous';

INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Photography', 'ফটোগ্রাফি', 'Site photography'
FROM expense_categories WHERE name = 'Miscellaneous';

INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Entertainment', 'আপ্যায়ন', 'Client entertainment'
FROM expense_categories WHERE name = 'Miscellaneous';

INSERT INTO expense_subcategories (category_id, name, name_bn, description)
SELECT id, 'Other', 'অন্যান্য', 'Other miscellaneous'
FROM expense_categories WHERE name = 'Miscellaneous';
