# Quick Setup Instructions - থিকাদারি হিসাব

## ✅ Environment Variables Configured

Your `.env.local` file has been created with your Supabase credentials:

- **Project URL**: https://qrnbpeowkkinjfksxavz.supabase.co
- **Anon Key**: Configured ✅
- **Service Role Key**: Configured ✅

## 🚀 Next Steps (In Order)

### Step 1: Install Dependencies (5 minutes)

```bash
npm install
```

This will install all required packages including Next.js, Supabase, TailwindCSS, shadcn/ui, etc.

### Step 2: Setup Supabase Database (10 minutes)

1. **Go to Supabase Dashboard**

   - Visit: https://supabase.com/dashboard/project/qrnbpeowkkinjfksxavz
   - Login with your account

2. **Open SQL Editor**

   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run Database Schema**

   - Copy entire content from `docs/03_DATABASE_SCHEMA.sql`
   - Paste into SQL Editor
   - Click "Run" (or press Ctrl+Enter)
   - Wait for "Success" message
   - You should see: "14 tables created, triggers added"

4. **Run RLS Policies**

   - Click "New Query" again
   - Copy entire content from `docs/04_RLS_POLICIES.sql`
   - Paste and Run
   - Wait for "Success" message
   - You should see: "RLS enabled, 40+ policies created"

5. **Run Seed Data**
   - Click "New Query" again
   - Copy entire content from `docs/05_SEED_DATA.sql`
   - Paste and Run
   - Wait for "Success" message
   - You should see: "Materials, work types, categories inserted"

### Step 3: Verify Database Setup (2 minutes)

In Supabase Dashboard:

1. **Check Tables**

   - Go to "Table Editor"
   - You should see 14 tables:
     - profiles
     - tenders
     - tender_assignments
     - materials
     - work_types
     - activity_categories
     - labor_entries
     - material_purchases
     - activity_expenses
     - advances
     - expense_submissions
     - person_ledgers
     - attachments
     - audit_logs

2. **Check Seed Data**

   - Click on "materials" table
   - You should see 30+ materials (Cement, Rod, Sand, etc.)
   - Click on "work_types" table
   - You should see 15+ work types
   - Click on "activity_categories" table
   - You should see 20+ categories

3. **Check Storage**
   - Go to "Storage" in sidebar
   - You should see "receipts" bucket created

### Step 4: Create First Admin User (3 minutes)

**Option A: Via Supabase Dashboard (Recommended)**

1. Go to "Authentication" → "Users"
2. Click "Add User" (green button)
3. Fill in:
   - Email: `admin@example.com` (or your email)
   - Password: `Admin@123` (or your choice)
   - Auto Confirm User: ✅ Check this box
4. Click "Create User"
5. **Copy the User ID** (you'll need it next)

**Set Admin Role:**

1. Go to "SQL Editor"
2. Run this query (replace `USER_ID_HERE` with the copied ID):

```sql
UPDATE profiles
SET role = 'owner', full_name = 'Admin User'
WHERE id = 'USER_ID_HERE';
```

3. Click "Run"
4. You should see: "1 row updated"

**Option B: Via Signup Page (After app is running)**

1. Start the app (Step 5)
2. Go to signup page
3. Register with your email
4. Then use SQL query above to set role to 'owner'

### Step 5: Start Development Server (1 minute)

```bash
npm run dev
```

You should see:

```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
- event compiled client and server successfully
```

### Step 6: Access the Application (1 minute)

1. Open browser: http://localhost:3000
2. You should be redirected to login page
3. Login with your admin credentials:
   - Email: `admin@example.com`
   - Password: `Admin@123`

### Step 7: Create First Tender (2 minutes)

After login:

1. You'll see dashboard (may be empty)
2. Go to Admin → Tenders (or navigate to `/admin/tenders`)
3. Click "নতুন টেন্ডার" (New Tender)
4. Fill in:
   - Tender Code: `TEST-001`
   - Project Name: `Test Project`
   - Location: `Dhaka`
5. Click "সংরক্ষণ করুন" (Save)
6. Assign yourself to the tender
7. Now you can start adding entries!

## 🎯 What to Implement Next

The project structure is ready, but you need to implement the pages and components. Follow this order:

### Priority 1: Authentication Pages

- [ ] `app/(auth)/login/page.tsx` - Login page
- [ ] `app/(auth)/signup/page.tsx` - Signup page

**Reference**: `docs/06_UI_UX_DESIGN.md` (Screen #1)

### Priority 2: Protected Layout

- [ ] `app/(protected)/layout.tsx` - Protected layout with sidebar
- [ ] `components/layout/Sidebar.tsx` - Navigation sidebar
- [ ] `components/layout/TenderSwitcher.tsx` - Tender selector

**Reference**: `docs/06_UI_UX_DESIGN.md` (Navigation Pattern)

### Priority 3: Dashboard

- [ ] `app/(protected)/dashboard/page.tsx` - Main dashboard
- [ ] `app/(protected)/tender/[tenderId]/page.tsx` - Tender dashboard
- [ ] `components/dashboard/SummaryCard.tsx`
- [ ] `components/QuickAddFAB.tsx`

**Reference**: `docs/06_UI_UX_DESIGN.md` (Screen #2), `docs/10_IMPLEMENTATION.md` (Section 7)

### Priority 4: Entry Forms

- [ ] Labor entry form
- [ ] Material purchase form
- [ ] Activity expense form
- [ ] Advance form
- [ ] Expense submission form

**Reference**: `docs/06_UI_UX_DESIGN.md` (Screens #3-7), `docs/07_WORKFLOWS.md`

## 📚 Documentation Reference

| Need              | See Document                        |
| ----------------- | ----------------------------------- |
| Complete overview | `docs/00_COMPLETE_SPECIFICATION.md` |
| All routes/pages  | `docs/02_SITEMAP.md`                |
| UI specifications | `docs/06_UI_UX_DESIGN.md`           |
| User workflows    | `docs/07_WORKFLOWS.md`              |
| Code patterns     | `docs/10_IMPLEMENTATION.md`         |
| Quick reference   | `docs/QUICK_REFERENCE.md`           |
| Full setup guide  | `docs/SETUP_GUIDE.md`               |

## 🐛 Troubleshooting

### "Cannot connect to Supabase"

- Check `.env.local` file exists and has correct values
- Restart dev server: Stop (Ctrl+C) and run `npm run dev` again
- Check Supabase project is active in dashboard

### "RLS Policy Violation"

- Make sure you ran all 3 SQL scripts
- Check user role is set to 'owner' in profiles table
- Verify user is assigned to tender in tender_assignments table

### "Tables not found"

- Make sure you ran `docs/03_DATABASE_SCHEMA.sql` successfully
- Check "Table Editor" in Supabase to verify tables exist

### "Seed data missing"

- Make sure you ran `docs/05_SEED_DATA.sql` successfully
- Check materials, work_types, activity_categories tables have data

### Build errors

- Run `npm run type-check` to find TypeScript errors
- Make sure all dependencies installed: `npm install`
- Check Node.js version: `node --version` (should be 18+)

## ✅ Verification Checklist

Before starting implementation:

- [ ] Dependencies installed (`node_modules` folder exists)
- [ ] `.env.local` file exists with Supabase credentials
- [ ] Database schema applied (14 tables visible in Supabase)
- [ ] RLS policies applied (can see policies in Table Editor)
- [ ] Seed data loaded (materials, work_types, categories have data)
- [ ] Storage bucket created (receipts bucket exists)
- [ ] Admin user created and role set to 'owner'
- [ ] Dev server starts without errors
- [ ] Can access http://localhost:3000

## 🎉 You're Ready!

Once all steps are complete:

1. Read `docs/10_IMPLEMENTATION.md` for code patterns
2. Start implementing pages following `docs/06_UI_UX_DESIGN.md`
3. Use `docs/QUICK_REFERENCE.md` during development
4. Test workflows from `docs/07_WORKFLOWS.md`

**Estimated time to complete setup**: 25-30 minutes

**Estimated time to implement all features**: 1-2 weeks for 1 developer

---

**Need help?** Check `docs/QUICK_REFERENCE.md` for common issues and solutions.
