# Fix MFS Charge Duplicate Issue

## Problem

MFS charges appearing twice in expenses overview:

1. As individual `person_expense` entries
2. As grouped `bKash Charges`

## Root Cause

- Old MFS charge entries exist in `person_expenses` table with `[MFS CHARGE]` prefix
- These shouldn't be in `person_expenses` table - they should only be in `expenses` table
- The `expense_rollup` view needs to properly filter them out

## Solution

### Step 1: Run SQL Script

Open your **Supabase SQL Editor** and run the script:

```sql
-- File: docs/FIX_MFS_CHARGE_DUPLICATES.sql
```

This will:

1. Delete all `[MFS CHARGE]` entries from `person_expenses` table
2. Recreate the `expense_rollup` view with proper filtering
3. Ensure MFS charges only come from the `expenses` table

### Step 2: Verify

After running the script, check:

```sql
-- Should return 0
SELECT COUNT(*) FROM person_expenses
WHERE description LIKE '[MFS CHARGE]%';

-- Check expense breakdown
SELECT source_type, COUNT(*) as count, SUM(amount) as total
FROM expense_rollup
GROUP BY source_type
ORDER BY source_type;
```

### Step 3: Test

1. Go to expenses overview page
2. Verify MFS charges appear ONCE (grouped)
3. No duplicate entries

## About Checkbox Issue

If MFS charges are being added even when checkbox is unchecked:

- Check if old entries exist (from before checkbox was added)
- The current code properly checks `includeMfsCharge` flag
- After running the SQL cleanup, only future entries with checkbox enabled will create charges

## Important Notes

- Person advances will now ONLY create MFS charge entries when you check the box
- Old incorrect entries in `person_expenses` table will be removed
- The expense_rollup view now properly filters to avoid duplicates
