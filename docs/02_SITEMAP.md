# Section 2: Sitemap / Route Map

## Public Routes

- `/` - Landing page with login
- `/auth/login` - Login page
- `/auth/signup` - Registration (admin approval required)
- `/auth/forgot-password` - Password reset

## Protected Routes (Require Authentication)

### Dashboard & Tender Selection

- `/dashboard` - Tender list/switcher (if multiple tenders assigned)
- `/tender/[tenderId]` - Main tender dashboard
  - Query params: `?from=YYYY-MM-DD&to=YYYY-MM-DD` (date filter)

### Labor Module

- `/tender/[tenderId]/labor` - Labor register list
  - Query params: `?type=contract|daily&from=&to=&work_type=`
- `/tender/[tenderId]/labor/add` - Quick add labor entry
- `/tender/[tenderId]/labor/[entryId]` - View/edit labor entry
- `/tender/[tenderId]/labor/[entryId]/attachments` - Manage receipts

### Materials Module

- `/tender/[tenderId]/materials` - Materials register list
  - Query params: `?item=&supplier=&from=&to=`
- `/tender/[tenderId]/materials/add` - Add material purchase
- `/tender/[tenderId]/materials/add-bulk` - Bulk breakdown entry (sand/stone)
- `/tender/[tenderId]/materials/[entryId]` - View/edit material entry

### Activity/Expense Module

- `/tender/[tenderId]/activities` - Activity expenses list
  - Query params: `?category=&subcategory=&from=&to=`
- `/tender/[tenderId]/activities/add` - Add activity expense
- `/tender/[tenderId]/activities/[entryId]` - View/edit activity

### Advances & Settlement

- `/tender/[tenderId]/advances` - Advances register
  - Query params: `?person=&from=&to=`
- `/tender/[tenderId]/advances/give` - Give advance to person
- `/tender/[tenderId]/advances/[advanceId]` - View advance details
- `/tender/[tenderId]/expenses` - Expense submissions list
- `/tender/[tenderId]/expenses/submit` - Submit expense (by site person)
- `/tender/[tenderId]/expenses/[expenseId]` - View/approve expense
- `/tender/[tenderId]/ledger/[personId]` - Person-wise ledger (advances vs expenses)

### Reports

- `/tender/[tenderId]/reports` - Reports menu
- `/tender/[tenderId]/reports/daily?date=YYYY-MM-DD` - Daily sheet
- `/tender/[tenderId]/reports/labor?from=&to=` - Labor register report
- `/tender/[tenderId]/reports/materials?from=&to=` - Materials register report
- `/tender/[tenderId]/reports/activities?from=&to=&category=` - Activity expenses report
- `/tender/[tenderId]/reports/advances?from=&to=&person=` - Advance ledger report
- `/tender/[tenderId]/reports/summary?from=&to=` - Tender summary report

### Excel Export

- `/api/tender/[tenderId]/export?from=&to=` - Download Excel workbook

### Admin/Settings

- `/admin/tenders` - Manage tenders (create, edit, archive)
- `/admin/tenders/[tenderId]/assign` - Assign users to tender
- `/admin/users` - User management
- `/admin/masters` - Master data (materials, categories, work types)
- `/admin/masters/materials` - Materials master list
- `/admin/masters/categories` - Activity categories
- `/admin/masters/work-types` - Labor work types
- `/settings/profile` - User profile
- `/settings/preferences` - App preferences (language, theme)

## Quick Actions (Modal/Drawer)

- Quick Add (accessible from tender dashboard):
  - Add Labor Entry
  - Add Material Purchase
  - Add Activity Expense
  - Give Advance
  - Submit Expense
