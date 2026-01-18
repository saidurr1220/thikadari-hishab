# Section 1: One-Page Overview

## What the App Does

A mobile-first construction contractor accounting system ("থিকাদারি হিসাব") for Bangladeshi contractors managing multiple tenders/projects. Each tender maintains completely separate accounts with comprehensive tracking of labor, materials, site activities, advances, and expense settlements.

## Who Uses It

- **Owner/Admin**: Full system access, create tenders, assign users, view all reports
- **Accountant**: Financial oversight, approve expenses, generate reports
- **Site Manager**: Day-to-day site operations, approve labor/material entries
- **Site Engineer**: Technical oversight, activity tracking
- **Foreman**: Labor management, daily entries
- **Driver/Equipment Operator**: Submit fuel/maintenance expenses
- **Viewer/Auditor**: Read-only access for external audits

## Key Constraints

1. **Tender Isolation**: All data strictly scoped by tender_id - no cross-tender queries
2. **Mobile-First**: Primary data entry on mobile devices at construction sites
3. **Bangla UI**: All labels, reports, and user-facing text in Bengali
4. **Offline-Ready**: Forms work with poor connectivity, sync when available
5. **Receipt Management**: Every expense can attach photos stored in Supabase Storage
6. **RLS Security**: Row-level security ensures users only access assigned tenders
7. **Audit Trail**: All entries track created_by, updated_by with timestamps
8. **Print-Ready**: A4 reports with proper formatting for physical filing
9. **Excel Export**: Multi-sheet workbooks for external analysis
10. **Bulk Operations**: Special handling for sand/stone purchases with cft-based breakdown

## Core Business Logic

- **Labor**: Contract crews (khoraki-based) + daily labor (wage-based)
- **Materials**: Item purchases with optional bulk breakdown (transport + unloading)
- **Activities**: Extensive work categories (road, concrete, excavation, equipment rental, etc.)
- **Advances**: Money given to site persons → expense submissions → settlement ledger
- **Dashboard**: Real-time tender-wise financial summary with drill-down capability
