# Section 6: Core Workflows

## Workflow 1: Create Tender & Assign People

### Steps (Admin/Owner)

1. Navigate to `/admin/tenders`
2. Click "নতুন টেন্ডার" (New Tender)
3. Fill form:
   - Tender Code (auto-generated or manual)
   - Project Name
   - Location
   - Client Department (optional)
   - Start Date (optional)
   - Notes
4. Click "সংরক্ষণ করুন" (Save)
5. Redirect to tender assignment page
6. Search and select users
7. Assign role for each user in this tender
8. Click "নিয়োগ করুন" (Assign)
9. Users now see tender in their dashboard

### Business Rules

- Tender code must be unique
- At least one admin/accountant must be assigned
- Users receive notification of assignment

## Workflow 2: Quick Add Labor Entry (Mobile)

### Steps (Foreman/Site Manager)

1. On tender dashboard, tap FAB (Quick Add)
2. Select "শ্রমিক এন্ট্রি" (Labor Entry)
3. Modal opens with form
4. Select type: Contract or Daily
5. **If Contract:**
   - Enter crew name
   - Select work type from dropdown
   - Enter headcount
   - Enter khoraki (per head or total)
   - Enter wage (optional)
6. **If Daily:**
   - Enter labor name (optional)
   - Select work type
   - Enter headcount (optional)
   - Enter wage total
7. Add note if needed
8. Tap camera icon to attach receipt
9. Review summary at bottom
10. Tap "সংরক্ষণ করুন" (Save)
11. Success toast, modal closes
12. Entry appears in recent entries

### Validation

- Date defaults to today
- At least one amount (khoraki or wage) required
- Work type required
- Photo optional but recommended

## Workflow 3: Material Purchase with Bulk Breakdown

### Steps (Site Manager/Accountant)

1. Quick Add → "মালামাল ক্রয়" (Material Purchase)
2. Toggle to "বাল্ক (বালু/পাথর)" (Bulk)
3. Select item: "Sylhet Sand"
4. Enter quantity in cft: 100
5. Enter base rate per cft: 45
6. **Breakdown auto-calculates:**
   - Base cost: 100 × 45 = 4,500
7. Enter transport vara cost: 3,000
8. Enter unload rate per cft: 3.5
9. **Breakdown updates:**
   - Unload cost: 100 × 3.5 = 350
   - **Grand Total: 4,500 + 3,000 + 350 = 7,850**
10. Enter supplier name
11. Select payment method: "Cash"
12. Attach receipt (truck chalan photo)
13. Save
14. Entry recorded with full breakdown

### Display in Register

- Shows as single line with drill-down
- Clicking shows breakdown details
- Export includes breakdown columns

## Workflow 4: Site Activity Expense Entry

### Steps (Site Engineer/Manager)

1. Quick Add → "কাজের খরচ" (Activity Expense)
2. Select category: "Equipment Rental"
3. Select subcategory: "Excavator/Vekku"
4. Enter description: "Vekku rental for foundation excavation"
5. **Optional Mini-BOQ:**
   - Quantity: 8 (hours)
   - Unit: "hour"
   - Rate: 1,200
   - Auto-calculates: 9,600
6. Amount field auto-filled: 9,600
7. Enter vendor: "Karim Vekku Service"
8. Payment method: "Advance" (paid from site manager's advance)
9. Attach receipt (handwritten chit photo)
10. Save

### Category Examples

- **Road Works**: Compaction, leveling, base course
- **Concrete Works**: Guide wall, foundation, column casting
- **Equipment Rental**: Excavator, roller, mixer, generator, pump
- **Transport**: Dump truck, pickup, tractor
- **Formwork**: Shuttering material, scaffolding
- **Safety**: Helmets, boots, safety net
- **Overhead**: Tea/snacks, mobile bill, office supplies

## Workflow 5: Advance Transfer → Expense Submission → Settlement

### Part A: Give Advance (Accountant)

1. Navigate to `/tender/[id]/advances/give`
2. Select person: "Rahim (Site Manager)"
3. Current balance shows: ৳ 2,500 (previous balance)
4. Enter amount: 10,000
5. Method: Bank Transfer
6. Reference: "TXN123456"
7. Purpose: "Site expenses for next week"
8. Save
9. **Ledger updates:**
   - Rahim's balance: 2,500 + 10,000 = 12,500

### Part B: Submit Expense (Site Manager - Rahim)

1. Rahim logs in on mobile
2. Quick Add → "খরচ জমা" (Submit Expense)
3. Date: Today
4. Category: "Transport"
5. Subcategory: "Dump Truck"
6. Description: "3 trips for soil removal"
7. Amount: 4,500
8. Attach receipt (truck slip photo)
9. Submit
10. Status: "Pending" (orange badge)
11. **Ledger NOT updated yet** (still 12,500)

### Part C: Approve Expense (Accountant)

1. Accountant sees notification: "1 pending expense"
2. Navigate to `/tender/[id]/expenses`
3. Click on Rahim's expense
4. Review details and receipt
5. Click "অনুমোদন করুন" (Approve)
6. Confirmation dialog
7. Approve
8. **Ledger updates:**
   - Rahim's balance: 12,500 - 4,500 = 8,000
9. Rahim sees status: "Approved" (green badge)

### Part D: Settlement

- When balance reaches near zero, accountant reviews
- If balance negative (company owes), process payment
- If balance positive (person owes), request return or adjust
- Full timeline visible in person ledger

## Workflow 6: Generate & Print Daily Sheet

### Steps (Accountant/Manager)

1. Navigate to `/tender/[id]/reports/daily`
2. Select date: Yesterday
3. Report loads with all entries for that date:
   - Labor entries (contract + daily)
   - Material purchases
   - Activity expenses
   - Advances given
   - Expenses submitted (approved only)
4. Review totals by category
5. Click "প্রিন্ট করুন" (Print)
6. Print dialog opens
7. **A4 Layout:**
   - Header: Tender info, date, prepared by
   - Labor section with subtotal
   - Materials section with subtotal
   - Activities section with subtotal
   - Grand total at bottom
   - Footer: Prepared by, Checked by, Approved by (signature lines)
8. Print or Save as PDF
9. File in physical records

## Workflow 7: Excel Export for External Analysis

### Steps (Accountant/Owner)

1. Navigate to `/tender/[id]/reports`
2. Click "এক্সেল ডাউনলোড" (Download Excel)
3. Select date range: This Month
4. Click "ডাউনলোড" (Download)
5. API generates Excel workbook:
   - **Sheet 1: Summary**
     - Tender info
     - Date range
     - Category-wise totals
     - Person-wise totals
   - **Sheet 2: Labor**
     - All labor entries with columns
   - **Sheet 3: Materials**
     - All material purchases
     - Bulk breakdown in separate columns
   - **Sheet 4: Activities**
     - All activity expenses
   - **Sheet 5: Advances**
     - All advances given
   - **Sheet 6: Expenses**
     - All expense submissions with status
   - **Sheet 7: Person Ledgers**
     - Person-wise balance summary
   - **Sheet 8: Attachments Index**
     - List of all attachments with download links
6. File downloads: `Tender_ABC123_2024-12.xlsx`
7. Open in Excel/Google Sheets for analysis

## Workflow 8: Mobile Data Entry with Poor Connectivity

### Steps (Foreman at Remote Site)

1. Open app on mobile (4G weak signal)
2. App loads cached tender data
3. Quick Add → Labor Entry
4. Fill form (all client-side validation)
5. Attach photo from camera
6. Click Save
7. **If offline:**
   - Entry saved to IndexedDB (local storage)
   - Toast: "সংরক্ষিত (অফলাইন)" (Saved offline)
   - Sync icon shows pending
8. **When connection returns:**
   - Background sync triggers
   - Entry uploaded to Supabase
   - Photo uploaded to Storage
   - Toast: "সিঙ্ক সম্পন্ন" (Synced)
   - Sync icon clears
9. Entry now visible to all users

### Technical Implementation

- Service Worker for offline support
- IndexedDB for local queue
- Background Sync API
- Optimistic UI updates
- Conflict resolution (last-write-wins)

## Workflow 9: Audit Trail Review

### Steps (Owner/Auditor)

1. Navigate to `/tender/[id]/audit`
2. View timeline of all changes
3. Filter by:
   - User
   - Action type (create/update/delete)
   - Entity type (labor/material/etc.)
   - Date range
4. Click on entry to see:
   - Who made change
   - When
   - What changed (old vs new values)
   - IP address (optional)
5. Export audit log to Excel
6. Use for compliance/investigation

## Workflow 10: Bulk Import from Excel (Future)

### Steps (Accountant)

1. Download template: `/admin/templates/bulk-import`
2. Fill Excel with multiple entries
3. Upload via `/tender/[id]/import`
4. System validates:
   - Required fields
   - Data types
   - Foreign keys (items, categories, etc.)
5. Shows preview with errors highlighted
6. Fix errors in Excel, re-upload
7. Confirm import
8. All entries created with "Imported by [User]" note
9. Audit log records bulk import
