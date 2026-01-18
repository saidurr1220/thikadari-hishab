# Quick Reference Guide

## Common Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run build           # Build for production
npm run start           # Start production server
npm run type-check      # Check TypeScript errors
npm run lint            # Run ESLint

# Database
# Run in Supabase SQL Editor:
# 1. docs/03_DATABASE_SCHEMA.sql
# 2. docs/04_RLS_POLICIES.sql
# 3. docs/05_SEED_DATA.sql
```

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Database Tables Quick Reference

| Table                 | Purpose            | Key Fields                                       |
| --------------------- | ------------------ | ------------------------------------------------ |
| `profiles`            | User profiles      | id, full_name, role                              |
| `tenders`             | Projects           | id, tender_code, project_name                    |
| `tender_assignments`  | User-tender access | tender_id, user_id, role                         |
| `labor_entries`       | Labor expenses     | tender_id, labor_type, khoraki_total, wage_total |
| `material_purchases`  | Material purchases | tender_id, material_id, quantity, total_amount   |
| `activity_expenses`   | Work expenses      | tender_id, category_id, amount                   |
| `advances`            | Money given        | tender_id, person_id, amount                     |
| `expense_submissions` | Expense claims     | tender_id, submitted_by, amount, status          |
| `person_ledgers`      | Balance tracking   | tender_id, person_id, current_balance            |
| `attachments`         | Receipt files      | entity_type, entity_id, file_path                |

## User Roles

| Role            | Permissions                                 |
| --------------- | ------------------------------------------- |
| `owner`         | Full access to everything                   |
| `admin`         | Full access to everything                   |
| `accountant`    | View all, approve expenses, manage finances |
| `site_manager`  | View all, add entries, approve expenses     |
| `site_engineer` | View all, add entries                       |
| `foreman`       | View assigned tender, add labor entries     |
| `driver`        | View assigned tender, submit expenses       |
| `viewer`        | Read-only access                            |

## Common Queries

### Get user's tenders

```typescript
const { data } = await supabase
  .from("tender_assignments")
  .select("tender_id, tenders(*)")
  .eq("user_id", userId);
```

### Get labor entries for tender

```typescript
const { data } = await supabase
  .from("labor_entries")
  .select("*, work_types(name_bn)")
  .eq("tender_id", tenderId)
  .gte("entry_date", fromDate)
  .lte("entry_date", toDate)
  .order("entry_date", { ascending: false });
```

### Get person ledger

```typescript
const { data } = await supabase
  .from("person_ledgers")
  .select("*, profiles(full_name)")
  .eq("tender_id", tenderId)
  .eq("person_id", personId)
  .single();
```

### Upload attachment

```typescript
const { data, error } = await supabase.storage
  .from("receipts")
  .upload(`${userId}/${tenderId}/${filename}`, file);
```

## Bangla Labels

```typescript
import { labels } from '@/lib/utils/bangla';

// Usage
<Button>{labels.save}</Button> // সংরক্ষণ করুন
<Label>{labels.amount}</Label> // পরিমাণ
```

## Format Utilities

```typescript
import { formatCurrency, formatDate, toBanglaNumber } from "@/lib/utils/format";

formatCurrency(12345.67); // ৳ 12,345.67
formatDate(new Date()); // 24/12/2024
toBanglaNumber(123); // ১২৩
```

## Validation Schemas

```typescript
import { laborEntrySchema } from "@/lib/validations/labor";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

const form = useForm({
  resolver: zodResolver(laborEntrySchema),
  defaultValues: {
    tender_id: tenderId,
    entry_date: new Date(),
    labor_type: "contract",
  },
});
```

## Component Patterns

### Server Component (Data Fetching)

```typescript
// app/tender/[tenderId]/page.tsx
import { createClient } from "@/lib/supabase/server";

export default async function TenderPage({ params }) {
  const supabase = createClient();
  const { data } = await supabase
    .from("tenders")
    .select("*")
    .eq("id", params.tenderId)
    .single();

  return <div>{data.project_name}</div>;
}
```

### Client Component (Form)

```typescript
// components/forms/LaborEntryForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";

export function LaborEntryForm({ tenderId }) {
  const supabase = createClient();
  const form = useForm();

  const onSubmit = async (data) => {
    const { error } = await supabase.from("labor_entries").insert(data);

    if (!error) {
      // Success
    }
  };

  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>;
}
```

## Print Styles

```typescript
// Add to component
<div className="print:hidden">
  <Button>Print</Button>
</div>

<div className="hidden print:block">
  <ReportHeader />
</div>

// Trigger print
window.print();
```

## Excel Export

```typescript
// app/api/tender/[tenderId]/export/route.ts
import * as XLSX from "xlsx";

export async function GET(request, { params }) {
  // Fetch data
  const data = await fetchData(params.tenderId);

  // Create workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

  // Generate buffer
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  // Return file
  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="export.xlsx"',
    },
  });
}
```

## Troubleshooting

### "Invalid API Key"

- Check `.env.local` has correct Supabase keys
- Restart dev server: `npm run dev`

### "RLS Policy Violation"

- Check user is assigned to tender in `tender_assignments`
- Check user role in `profiles` table
- Verify RLS policies are applied

### "Cannot upload files"

- Check Storage bucket "receipts" exists
- Check Storage policies are applied
- Check file size < 10MB

### "Bangla text not showing"

- Check internet connection (Google Fonts)
- Clear browser cache
- Verify font import in `globals.css`

### Build errors

- Run `npm run type-check` to find TypeScript errors
- Check all imports are correct
- Verify environment variables are set

## Useful Links

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [TailwindCSS](https://tailwindcss.com/docs)
- [React Hook Form](https://react-hook-form.com)
- [Zod](https://zod.dev)

## File Locations

| What             | Where                                  |
| ---------------- | -------------------------------------- |
| Pages            | `app/(protected)/`                     |
| Components       | `components/`                          |
| API Routes       | `app/api/`                             |
| Database Schema  | `docs/03_DATABASE_SCHEMA.sql`          |
| RLS Policies     | `docs/04_RLS_POLICIES.sql`             |
| Seed Data        | `docs/05_SEED_DATA.sql`                |
| Utilities        | `lib/utils/`                           |
| Validations      | `lib/validations/`                     |
| Supabase Clients | `lib/supabase/`                        |
| Styles           | `app/globals.css`                      |
| Config           | `next.config.js`, `tailwind.config.ts` |

## Development Workflow

1. **Create new feature**

   - Add route in `app/(protected)/`
   - Create component in `components/`
   - Add validation schema in `lib/validations/`
   - Update database if needed

2. **Test locally**

   - Run `npm run dev`
   - Test in browser
   - Check mobile view (DevTools)
   - Test with different roles

3. **Deploy**
   - Commit to git
   - Push to GitHub
   - Vercel auto-deploys
   - Test production

## Performance Tips

- Use Server Components for data fetching
- Use Client Components only when needed (forms, interactivity)
- Add indexes to frequently queried columns
- Use pagination for large lists
- Optimize images (Next.js automatic)
- Enable Supabase connection pooling
- Cache static data

## Security Checklist

- [ ] RLS enabled on all tables
- [ ] Service role key kept secret
- [ ] Strong passwords enforced
- [ ] Email verification enabled
- [ ] HTTPS only (Vercel automatic)
- [ ] Regular backups
- [ ] Audit logs reviewed
- [ ] User access reviewed quarterly
