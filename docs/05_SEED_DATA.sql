-- Section 4 (continued): Seed Data

-- ============================================
-- DEFAULT MATERIALS
-- ============================================

INSERT INTO materials (name, name_bn, unit, unit_bn, category) VALUES
-- Cement & Binding
('Cement', 'সিমেন্ট', 'bag', 'ব্যাগ', 'cement'),
('Lime', 'চুন', 'kg', 'কেজি', 'cement'),

-- Steel & Reinforcement
('Rod 10mm', '১০ মিমি রড', 'kg', 'কেজি', 'steel'),
('Rod 12mm', '১২ মিমি রড', 'kg', 'কেজি', 'steel'),
('Rod 16mm', '১৬ মিমি রড', 'kg', 'কেজি', 'steel'),
('Rod 20mm', '২০ মিমি রড', 'kg', 'কেজি', 'steel'),
('Binding Wire', 'বাঁধার তার', 'kg', 'কেজি', 'steel'),

-- Aggregates
('Sylhet Sand', 'সিলেট বালু', 'cft', 'ঘনফুট', 'aggregate'),
('Local Sand', 'স্থানীয় বালু', 'cft', 'ঘনফুট', 'aggregate'),
('Stone Chips 3/4"', 'পাথর চিপস ৩/৪"', 'cft', 'ঘনফুট', 'aggregate'),
('Stone Chips 1/2"', 'পাথর চিপস ১/২"', 'cft', 'ঘনফুট', 'aggregate'),
('Stone Dust', 'পাথর গুঁড়া', 'cft', 'ঘনফুট', 'aggregate'),
('Brick Chips', 'ইটের খোয়া', 'cft', 'ঘনফুট', 'aggregate'),

-- Bricks & Blocks
('1st Class Brick', 'প্রথম শ্রেণীর ইট', 'pcs', 'পিস', 'brick'),
('2nd Class Brick', 'দ্বিতীয় শ্রেণীর ইট', 'pcs', 'পিস', 'brick'),
('Concrete Block', 'কংক্রিট ব্লক', 'pcs', 'পিস', 'brick'),

-- Timber & Formwork
('Timber (Sylhet)', 'কাঠ (সিলেট)', 'cft', 'ঘনফুট', 'timber'),
('Plywood', 'প্লাইউড', 'sheet', 'শিট', 'timber'),
('Bamboo', 'বাঁশ', 'pcs', 'পিস', 'timber'),

-- Hardware
('Nails', 'পেরেক', 'kg', 'কেজি', 'hardware'),
('Bolts & Nuts', 'বোল্ট ও নাট', 'pcs', 'পিস', 'hardware'),
('GI Wire', 'জিআই তার', 'kg', 'কেজি', 'hardware'),

-- Fuel & Lubricants
('Diesel', 'ডিজেল', 'liter', 'লিটার', 'fuel'),
('Petrol', 'পেট্রোল', 'liter', 'লিটার', 'fuel'),
('Engine Oil', 'ইঞ্জিন তেল', 'liter', 'লিটার', 'fuel'),

-- Miscellaneous
('Polythene', 'পলিথিন', 'kg', 'কেজি', 'misc'),
('Rope', 'দড়ি', 'kg', 'কেজি', 'misc'),
('Tarpaulin', 'তেরপল', 'pcs', 'পিস', 'misc');

-- ============================================
-- DEFAULT WORK TYPES
-- ============================================

INSERT INTO work_types (name, name_bn, category) VALUES
-- Earthwork
('Excavation', 'মাটি কাটা', 'earthwork'),
('Filling', 'ভরাট', 'earthwork'),
('Compaction', 'কম্প্যাকশন', 'earthwork'),

-- Concrete Work
('Concrete Casting', 'কংক্রিট ঢালাই', 'concrete'),
('Concrete Mixing', 'কংক্রিট মিশ্রণ', 'concrete'),
('Curing', 'কিউরিং', 'concrete'),

-- Masonry
('Brick Work', 'ইটের কাজ', 'masonry'),
('Plastering', 'প্লাস্টার', 'masonry'),
('Pointing', 'পয়েন্টিং', 'masonry'),

-- Steel Work
('Rod Cutting & Bending', 'রড কাটা ও বাঁকানো', 'steel'),
('Rod Binding', 'রড বাঁধা', 'steel'),

-- Formwork
('Shuttering', 'শাটারিং', 'formwork'),
('Centering', 'সেন্টারিং', 'formwork'),

-- Finishing
('Tiles Work', 'টাইলস কাজ', 'finishing'),
('Painting', 'রং', 'finishing'),

-- General Labor
('Helper', 'হেল্পার', 'general'),
('Material Handling', 'মালামাল উঠানো-নামানো', 'general');

-- ============================================
-- DEFAULT ACTIVITY CATEGORIES
-- ============================================

INSERT INTO activity_categories (name, name_bn, parent_id) VALUES
-- Main Categories
('Road Works', 'রাস্তার কাজ', NULL),
('Concrete Works', 'কংক্রিট কাজ', NULL),
('Earthwork', 'মাটির কাজ', NULL),
('Equipment Rental', 'যন্ত্রপাতি ভাড়া', NULL),
('Transport', 'পরিবহন', NULL),
('Formwork', 'ফর্মওয়ার্ক', NULL),
('Safety & PPE', 'নিরাপত্তা সামগ্রী', NULL),
('Overhead', 'ওভারহেড খরচ', NULL),
('Utilities', 'ইউটিলিটি', NULL);

-- Subcategories for Equipment Rental
INSERT INTO activity_categories (name, name_bn, parent_id)
SELECT 'Excavator/Vekku', 'এক্সকাভেটর/ভেকু', id FROM activity_categories WHERE name = 'Equipment Rental';

INSERT INTO activity_categories (name, name_bn, parent_id)
SELECT 'Roller', 'রোলার', id FROM activity_categories WHERE name = 'Equipment Rental';

INSERT INTO activity_categories (name, name_bn, parent_id)
SELECT 'Concrete Mixer', 'কংক্রিট মিক্সার', id FROM activity_categories WHERE name = 'Equipment Rental';

INSERT INTO activity_categories (name, name_bn, parent_id)
SELECT 'Generator', 'জেনারেটর', id FROM activity_categories WHERE name = 'Equipment Rental';

INSERT INTO activity_categories (name, name_bn, parent_id)
SELECT 'Water Pump', 'পানির পাম্প', id FROM activity_categories WHERE name = 'Equipment Rental';

-- Subcategories for Transport
INSERT INTO activity_categories (name, name_bn, parent_id)
SELECT 'Dump Truck', 'ডাম্প ট্রাক', id FROM activity_categories WHERE name = 'Transport';

INSERT INTO activity_categories (name, name_bn, parent_id)
SELECT 'Pickup/Covered Van', 'পিকআপ/কভার্ড ভ্যান', id FROM activity_categories WHERE name = 'Transport';

INSERT INTO activity_categories (name, name_bn, parent_id)
SELECT 'Tractor', 'ট্রাক্টর', id FROM activity_categories WHERE name = 'Transport';

-- Subcategories for Concrete Works
INSERT INTO activity_categories (name, name_bn, parent_id)
SELECT 'Guide Wall', 'গাইড ওয়াল', id FROM activity_categories WHERE name = 'Concrete Works';

INSERT INTO activity_categories (name, name_bn, parent_id)
SELECT 'Foundation', 'ভিত্তি', id FROM activity_categories WHERE name = 'Concrete Works';

INSERT INTO activity_categories (name, name_bn, parent_id)
SELECT 'Column', 'কলাম', id FROM activity_categories WHERE name = 'Concrete Works';

INSERT INTO activity_categories (name, name_bn, parent_id)
SELECT 'Beam', 'বিম', id FROM activity_categories WHERE name = 'Concrete Works';

INSERT INTO activity_categories (name, name_bn, parent_id)
SELECT 'Slab', 'স্ল্যাব', id FROM activity_categories WHERE name = 'Concrete Works';

-- Subcategories for Overhead
INSERT INTO activity_categories (name, name_bn, parent_id)
SELECT 'Tea & Snacks', 'চা-নাস্তা', id FROM activity_categories WHERE name = 'Overhead';

INSERT INTO activity_categories (name, name_bn, parent_id)
SELECT 'Mobile Bill', 'মোবাইল বিল', id FROM activity_categories WHERE name = 'Overhead';

INSERT INTO activity_categories (name, name_bn, parent_id)
SELECT 'Office Supplies', 'অফিস সামগ্রী', id FROM activity_categories WHERE name = 'Overhead';

INSERT INTO activity_categories (name, name_bn, parent_id)
SELECT 'Minor Repairs', 'ক্ষুদ্র মেরামত', id FROM activity_categories WHERE name = 'Overhead';
