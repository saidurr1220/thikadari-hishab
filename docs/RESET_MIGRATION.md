# DB Reset Notes

This project now has a fresh, vendor/person-focused schema.

Run in Supabase SQL Editor (in order):
1) `docs/DB_RESET_SCHEMA.sql`
2) `docs/DB_RESET_RLS.sql`

What changed:
- New vendor-ledger tables: `vendor_categories`, `vendors`, `vendor_purchases`, `vendor_payments`
- New staff advance tables: `person_advances`, `person_expenses`
- New view: `expense_rollup` (all expenses in one place)

App routes now use:
- `/tender/[id]/expenses/vendors`
- `/tender/[id]/expenses/vendors/[vendorId]`
- `/tender/[id]/expenses/overview`
- `/tender/[id]/advances/people`
- `/tender/[id]/advances/people/[personId]`
