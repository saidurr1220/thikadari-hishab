# Troubleshooting Guide

## Common Errors and Solutions

### ❌ Error: "requested path is invalid"

**Cause**: Trying to access a page that doesn't exist yet.

**Solution**:

- ✅ **FIXED!** I've created placeholder pages for:
  - `/` - Landing page (now works!)
  - `/docs` - Documentation viewer
  - `/login` - Login placeholder

**What's still to implement**:

- `/dashboard` - Dashboard page
- `/tender/[id]` - Tender pages
- `/admin` - Admin pages
- All other routes from `docs/02_SITEMAP.md`

---

### ❌ Error: "Cannot connect to Supabase"

**Cause**: Environment variables not loaded or incorrect.

**Solutions**:

1. Check `.env.local` file exists in root directory
2. Verify it contains:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://qrnbpeowkkinjfksxavz.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
   ```
3. Restart dev server:
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

---

### ❌ Error: "Module not found" or "Cannot find module"

**Cause**: Dependencies not installed.

**Solution**:

```bash
npm install
```

If still failing:

```bash
rm -rf node_modules package-lock.json
npm install
```

---

### ❌ Error: Database/RLS errors when testing

**Cause**: Database not setup yet.

**Solution**:

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/qrnbpeowkkinjfksxavz
2. Click "SQL Editor" → "New Query"
3. Run these 3 scripts in order:
   - `docs/03_DATABASE_SCHEMA.sql`
   - `docs/04_RLS_POLICIES.sql`
   - `docs/05_SEED_DATA.sql`

---

### ❌ Error: TypeScript errors

**Cause**: Type checking issues.

**Solution**:

```bash
npm run type-check
```

Common fixes:

- Missing imports
- Incorrect prop types
- Database types not generated

To generate Supabase types:

```bash
npx supabase gen types typescript --project-id qrnbpeowkkinjfksxavz > lib/types/database.types.ts
```

---

### ❌ Error: Build fails

**Cause**: Various issues.

**Solutions**:

1. **Check TypeScript errors**:

   ```bash
   npm run type-check
   ```

2. **Clear Next.js cache**:

   ```bash
   rm -rf .next
   npm run dev
   ```

3. **Check all imports are correct**:
   - Use `@/` for absolute imports
   - Check file extensions (.ts, .tsx)

---

### ❌ Error: Styles not loading

**Cause**: TailwindCSS not configured properly.

**Solution**:

1. Check `tailwind.config.ts` exists
2. Check `app/globals.css` has Tailwind directives:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```
3. Restart dev server

---

### ❌ Error: "Middleware error"

**Cause**: Middleware trying to redirect to non-existent pages.

**Solution**:

- ✅ **FIXED!** Landing page now exists
- If you see this, check `middleware.ts` redirect paths

---

## Current Project Status

### ✅ Working Now:

- `/` - Landing page with project status
- `/docs` - Documentation viewer
- `/login` - Login placeholder
- All documentation files accessible

### ⏳ To Implement:

- Auth pages (login form, signup form)
- Dashboard pages
- Entry forms (labor, materials, activities, advances)
- Reports pages
- Admin pages
- All components

## Quick Checks

### 1. Verify Setup

```bash
# Check if dependencies installed
ls node_modules

# Check if .env.local exists
cat .env.local

# Check if dev server runs
npm run dev
```

### 2. Verify Database

1. Open: https://supabase.com/dashboard/project/qrnbpeowkkinjfksxavz
2. Go to "Table Editor"
3. Should see 14 tables (if scripts run)

### 3. Verify Pages

- http://localhost:3000 - Should show landing page
- http://localhost:3000/docs - Should show documentation
- http://localhost:3000/login - Should show login placeholder

## Getting Help

### Check Documentation:

1. **[START_HERE.md](START_HERE.md)** - Quick start
2. **[SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md)** - Detailed setup
3. **[docs/QUICK_REFERENCE.md](docs/QUICK_REFERENCE.md)** - Common issues

### Implementation Help:

1. **[docs/10_IMPLEMENTATION.md](docs/10_IMPLEMENTATION.md)** - Code patterns
2. **[docs/06_UI_UX_DESIGN.md](docs/06_UI_UX_DESIGN.md)** - UI specs
3. **[docs/07_WORKFLOWS.md](docs/07_WORKFLOWS.md)** - Business logic

## Next Steps

Now that the landing page works:

1. ✅ Landing page working
2. ⏳ Setup database (run 3 SQL scripts)
3. ⏳ Implement login page (with actual auth)
4. ⏳ Implement dashboard
5. ⏳ Implement forms
6. ⏳ Implement reports

**Follow [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md) for detailed steps!**

---

## Still Having Issues?

1. Check Node.js version: `node --version` (should be 18+)
2. Check npm version: `npm --version`
3. Try clean install:
   ```bash
   rm -rf node_modules .next
   npm install
   npm run dev
   ```
4. Check browser console for errors (F12)
5. Check terminal for server errors

---

**The error you saw is now fixed! The app should work at http://localhost:3000** ✅
