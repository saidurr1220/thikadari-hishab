# Section 5: UI/UX Design Spec (Mobile-First)

## Navigation Pattern

### Mobile (< 768px)

- **Bottom Navigation Bar** (fixed, 5 icons):

  - হোম (Home/Dashboard)
  - এন্ট্রি (Quick Add)
  - রিপোর্ট (Reports)
  - হিসাব (Ledger)
  - মেনু (More/Settings)

- **Top Bar**:
  - Tender Switcher (dropdown if multiple tenders)
  - Notification bell
  - User avatar/menu

### Desktop (≥ 768px)

- **Left Sidebar** (collapsible):

  - Tender switcher at top
  - Navigation menu (same as bottom nav)
  - Quick actions
  - User profile at bottom

- **Top Bar**:
  - Breadcrumb navigation
  - Date range filter (global)
  - Search
  - Notifications
  - User menu

## Design System (Bangla Labels)

### Color Palette

- Primary: Blue (#2563eb) - Actions, links
- Success: Green (#16a34a) - Approved, positive
- Warning: Orange (#ea580c) - Pending, caution
- Danger: Red (#dc2626) - Rejected, delete
- Neutral: Gray (#64748b) - Text, borders

### Typography

- Headings: Noto Sans Bengali (Bold)
- Body: Noto Sans Bengali (Regular)
- Numbers: Tiro Bangla (for Bengali numerals) or Roboto (for English numerals)

### Spacing

- Mobile: Compact (p-3, gap-2)
- Desktop: Comfortable (p-6, gap-4)

## Reusable Components

### 1. TenderSwitcher

- Dropdown showing current tender
- Shows: Tender Code, Project Name
- Badge: Active entries count

### 2. QuickAddButton (FAB on mobile)

- Floating Action Button (bottom-right on mobile)
- Opens modal with 5 options:
  - শ্রমিক এন্ট্রি (Labor Entry)
  - মালামাল ক্রয় (Material Purchase)
  - কাজের খরচ (Activity Expense)
  - অগ্রিম প্রদান (Give Advance)
  - খরচ জমা (Submit Expense)

### 3. DateRangePicker

- Bangla calendar support
- Presets: আজ (Today), এই সপ্তাহ (This Week), এই মাস (This Month)
- Custom range selector

### 4. AmountInput

- Number input with Bangla/English toggle
- Shows formatted amount (৳ 1,234.56)
- Calculator button for quick math

### 5. AttachmentUploader

- Camera button (mobile) + file picker
- Preview thumbnails
- Max 5 files per entry
- Shows file size

### 6. PersonSelector

- Searchable dropdown
- Shows: Name, Role, Current Balance
- Filter by role

### 7. DataTable (TanStack Table)

- Mobile: Card view (stacked)
- Desktop: Table view
- Sortable columns
- Inline filters
- Export button (Excel/PDF)

### 8. SummaryCard

- Icon + Label + Amount
- Trend indicator (up/down)
- Click to drill down

### 9. StatusBadge

- Pending: Orange
- Approved: Green
- Rejected: Red
- Color-coded with Bangla text

### 10. ConfirmDialog

- Bangla confirmation messages
- Primary/Secondary actions
- Danger variant for delete

## Screen Specifications (Mobile-First)

### 1. Login Screen (`/auth/login`)

**Layout (Top to Bottom):**

1. App logo + "থিকাদারি হিসাব"
2. Phone/Email input (ফোন/ইমেইল)
3. Password input (পাসওয়ার্ড)
4. "লগইন করুন" button (full width)
5. "পাসওয়ার্ড ভুলে গেছেন?" link

**Validation:**

- Phone: 11 digits (01XXXXXXXXX)
- Email: Valid format
- Password: Min 6 characters
- Error: "ফোন নম্বর বা পাসওয়ার্ড ভুল"

### 2. Tender Dashboard (`/tender/[tenderId]`)

**Layout:**

1. **Header Section**

   - Tender Code + Project Name
   - Location (if set)
   - Date range filter

2. **Summary Cards (Grid 2x2)**

   - আজকের খরচ (Today's Total)
   - এই সপ্তাহ (This Week)
   - এই মাসে (This Month)
   - মোট খরচ (Total to Date)

3. **Breakdown Section**

   - শ্রমিক খরচ (Labor): Amount + %
   - মালামাল (Materials): Amount + %
   - কাজের খরচ (Activities): Amount + %
   - অন্যান্য (Others): Amount + %

4. **Recent Entries (Last 10)**

   - Card per entry
   - Shows: Date, Type, Description, Amount
   - Tap to view details

5. **Quick Stats**
   - অগ্রিম বাকি (Pending Advances): Count + Amount
   - খরচ অনুমোদন বাকি (Pending Approvals): Count

**Actions:**

- FAB: Quick Add
- Filter button (top-right)
- Refresh (pull-to-refresh)

### 3. Labor Entry Form (`/tender/[tenderId]/labor/add`)

**Layout:**

1. **Type Selector (Tabs)**

   - চুক্তি/দল (Contract/Crew)
   - দৈনিক (Daily)

2. **Contract/Crew Tab Fields:**

   - তারিখ (Date) - Date picker
   - দলের নাম (Crew Name) - Text input
   - কাজের ধরন (Work Type) - Dropdown
   - লোক সংখ্যা (Headcount) - Number
   - খোরাকি (প্রতি জন) - Amount (optional)
   - খোরাকি (মোট) - Amount
   - মজুরি (মোট) - Amount (optional)
   - নোট - Textarea
   - রশিদ সংযুক্ত করুন - Attachment uploader

3. **Daily Tab Fields:**
   - তারিখ (Date)
   - শ্রমিকের নাম (Labor Name) - Optional
   - কাজের ধরন (Work Type)
   - লোক সংখ্যা (Headcount) - Optional
   - মজুরি (মোট) - Amount
   - খোরাকি (মোট) - Amount (optional)
   - নোট
   - রশিদ সংযুক্ত করুন

**Validation:**

- Date: Required, not future
- Crew Name: Required for contract
- Work Type: Required
- Amounts: > 0
- At least one amount (khoraki or wage) required

**Actions:**

- সংরক্ষণ করুন (Save) - Primary button
- বাতিল (Cancel) - Secondary

### 4. Material Purchase Form (`/tender/[tenderId]/materials/add`)

**Layout:**

1. **Purchase Type Toggle**

   - সাধারণ (Regular)
   - বাল্ক (বালু/পাথর) - Bulk Breakdown

2. **Regular Purchase Fields:**

   - তারিখ (Date)
   - মালামাল (Item) - Searchable dropdown
   - পরিমাণ (Quantity) - Number
   - একক (Unit) - Auto-filled from item
   - দর (Rate) - Amount
   - মোট (Total) - Auto-calculated
   - সরবরাহকারী (Supplier) - Text (optional)
   - পেমেন্ট পদ্ধতি (Payment Method) - Dropdown
   - পেমেন্ট রেফ (Payment Ref) - Text (optional)
   - নোট
   - রশিদ

3. **Bulk Breakdown Fields:**
   - তারিখ (Date)
   - মালামাল (Item) - Sand/Stone
   - পরিমাণ (ঘনফুট) - Number (cft)
   - দর (প্রতি ঘনফুট) - Amount
   - **Breakdown Section (Card):**
     - মূল খরচ: qty × rate = X
     - পরিবহন (ভাড়া): Amount
     - খালাস (প্রতি ঘনফুট): Amount (3-4 tk)
     - খালাস মোট: qty × unload_rate = Y
     - **সর্বমোট: X + transport + Y**
   - সরবরাহকারী
   - পেমেন্ট পদ্ধতি
   - নোট
   - রশিদ

**Validation:**

- All amounts > 0
- Quantity > 0
- Item required

### 5. Activity Expense Form (`/tender/[tenderId]/activities/add`)

**Layout:**

1. তারিখ (Date)
2. বিভাগ (Category) - Dropdown (main categories)
3. উপ-বিভাগ (Subcategory) - Dropdown (filtered by category)
4. বিবরণ (Description) - Text input
5. **Mini-BOQ Section (Optional, Collapsible)**
   - পরিমাণ (Quantity)
   - একক (Unit)
   - দর (Rate)
   - Auto-calculate amount
6. পরিমাণ (Amount) - Amount input (required)
7. বিক্রেতা (Vendor) - Text (optional)
8. পেমেন্ট পদ্ধতি (Payment Method)
9. পেমেন্ট রেফ (Payment Ref)
10. নোট
11. রশিদ

**Validation:**

- Date, Category, Description, Amount required
- If qty/unit/rate provided, must calculate to amount

### 6. Give Advance Form (`/tender/[tenderId]/advances/give`)

**Layout:**

1. তারিখ (Date)
2. ব্যক্তি (Person) - PersonSelector
   - Shows current balance below selector
3. পরিমাণ (Amount)
4. পদ্ধতি (Method) - Cash/Bank/MFS
5. রেফারেন্স (Reference) - Text (optional)
6. উদ্দেশ্য (Purpose) - Text
7. নোট

**Validation:**

- Person, Amount, Method required
- Amount > 0

### 7. Submit Expense Form (`/tender/[tenderId]/expenses/submit`)

**Layout:**

1. তারিখ (Date)
2. বিভাগ (Category)
3. উপ-বিভাগ (Subcategory)
4. বিবরণ (Description)
5. পরিমাণ (Amount)
6. নোট
7. রশিদ (Required for expenses > 500 tk)

**Validation:**

- All fields required except note
- Receipt required if amount > 500

### 8. Person Ledger (`/tender/[tenderId]/ledger/[personId]`)

**Layout:**

1. **Header Card**

   - Person name + role
   - Current balance (large, color-coded)
     - Green if balance > 0 (person owes)
     - Red if balance < 0 (company owes)

2. **Summary Section**

   - মোট অগ্রিম (Total Advances)
   - মোট খরচ (Total Expenses)
   - বাকি (Balance)

3. **Timeline (Chronological)**
   - Each entry card shows:
     - Date
     - Type (Advance/Expense)
     - Description
     - Amount (+ for advance, - for expense)
     - Running balance
     - Status (for expenses)
   - Tap to view details

**Actions:**

- Filter by date range
- Export to PDF

### 9. Reports Menu (`/tender/[tenderId]/reports`)

**Layout (Grid of Cards):**

1. দৈনিক শিট (Daily Sheet)
2. শ্রমিক খতিয়ান (Labor Register)
3. মালামাল খতিয়ান (Materials Register)
4. কাজভিত্তিক খরচ (Activity Expenses)
5. অগ্রিম হিসাব (Advance Ledger)
6. সারসংক্ষেপ (Tender Summary)

Each card:

- Icon
- Report name
- "দেখুন" (View) button
- "ডাউনলোড" (Download) button

### 10. Daily Sheet Report (`/tender/[tenderId]/reports/daily`)

**Layout:**

1. **Header**

   - Tender info
   - Date selector
   - Print button

2. **Sections (Collapsible on mobile)**
   - শ্রমিক খরচ (Labor)
     - Table: Type, Description, Amount
     - Subtotal
   - মালামাল (Materials)
     - Table: Item, Qty, Rate, Total
     - Subtotal
   - কাজের খরচ (Activities)
     - Table: Category, Description, Amount
     - Subtotal
   - **দিনের মোট (Day Total)**

**Actions:**

- Previous/Next day navigation
- Print (A4)
- Export Excel
