# Setup Guide - থিকাদারি হিসাব

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account (free tier works)
- Git (optional)

## Step 1: Clone/Download Project

```bash
# If using git
git clone <repository-url>
cd thikadari-hisab

# Or download and extract ZIP
```

## Step 2: Install Dependencies

```bash
npm install
# or
yarn install
```

## Step 3: Setup Supabase

### 3.1 Create Supabase Project

1. Go to https://supabase.com
2. Sign up / Log in
3. Click "New Project"
4. Fill in:
   - Name: thikadari-hisab
   - Database Password: (save this securely)
   - Region: Singapore (closest to Bangladesh)
5. Wait for project to be ready (~2 minutes)

### 3.2 Get API Keys

1. In Supabase dashboard, go to Settings → API
2. Copy:
   - Project URL
   - anon/public key
   - service_role key (keep secret!)

### 3.3 Run Database Schema

1. In Supabase dashboard, go to SQL Editor
2. Click "New Query"
3. Copy entire content from `docs/03_DATABASE_SCHEMA.sql`
4. Click "Run"
5. Wait for completion (should see "Success")
6. Repeat for `docs/04_RLS_POLICIES.sql`
7. Repeat for `docs/05_SEED_DATA.sql`

### 3.4 Setup Storage Bucket

1. Go to Storage in Supabase dashboard
2. Bucket "receipts" should be created by RLS policies
3. If not, create manually:
   - Name: receipts
   - Public: No (private)
   - File size limit: 10MB
   - Allowed MIME types: image/\*, application/pdf

## Step 4: Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 5: Run Development Server

```bash
npm run dev
# or
yarn dev
```

Open http://localhost:3000

## Step 6: Create First Admin User

### Option A: Via Supabase Dashboard

1. Go to Authentication → Users
2. Click "Add User"
3. Email: admin@example.com
4. Password: (your choice)
5. Auto Confirm User: Yes
6. Click "Create User"
7. Copy the user ID

### Option B: Via Signup Page

1. Go to http://localhost:3000/signup
2. Fill registration form
3. User will be created but needs admin role

### Set Admin Role

1. Go to SQL Editor in Supabase
2. Run:

```sql
UPDATE profiles
SET role = 'owner'
WHERE id = 'user-id-here';
```

## Step 7: Login & Create First Tender

1. Login with admin credentials
2. Go to Admin → Tenders
3. Click "নতুন টেন্ডার" (New Tender)
4. Fill:
   - Tender Code: TEST-001
   - Project Name: Test Project
   - Location: Dhaka
5. Save
6. Assign yourself to the tender
7. Start adding entries!

## Step 8: Deploy to Vercel (Production)

### 8.1 Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo>
git push -u origin main
```

### 8.2 Deploy on Vercel

1. Go to https://vercel.com
2. Sign up / Log in with GitHub
3. Click "New Project"
4. Import your repository
5. Configure:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: npm run build
   - Output Directory: .next
6. Add Environment Variables:
   - Copy all from `.env.local`
   - Update `NEXT_PUBLIC_APP_URL` to your Vercel domain
7. Click "Deploy"
8. Wait for deployment (~2 minutes)

### 8.3 Update Supabase Settings

1. In Supabase dashboard, go to Authentication → URL Configuration
2. Add your Vercel domain to:
   - Site URL: https://your-app.vercel.app
   - Redirect URLs: https://your-app.vercel.app/**

## Troubleshooting

### Issue: "Invalid API Key"

- Check `.env.local` has correct keys
- Restart dev server after changing env vars
- Ensure no extra spaces in keys

### Issue: "Row Level Security Policy Violation"

- Check user is assigned to tender
- Check user role in profiles table
- Review RLS policies in Supabase

### Issue: "Cannot upload files"

- Check Storage bucket exists
- Check Storage policies are applied
- Check file size < 10MB

### Issue: "Bangla text not showing"

- Check internet connection (Google Fonts)
- Clear browser cache
- Check font import in `globals.css`

### Issue: "Build fails on Vercel"

- Check all dependencies in package.json
- Check TypeScript errors: `npm run type-check`
- Check build locally: `npm run build`

## Next Steps

1. **Customize Master Data**

   - Add your materials in Admin → Masters → Materials
   - Add work types
   - Add activity categories

2. **Create Users**

   - Add site managers, accountants, etc.
   - Assign roles appropriately

3. **Setup Tenders**

   - Create real tenders
   - Assign team members

4. **Train Users**

   - Show mobile data entry
   - Demonstrate reports
   - Practice workflows

5. **Backup Strategy**
   - Supabase auto-backups (paid plans)
   - Regular Excel exports
   - Database dumps via Supabase CLI

## Support & Resources

- Documentation: See `docs/` folder
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
- shadcn/ui: https://ui.shadcn.com

## Security Checklist

- [ ] Change default admin password
- [ ] Keep service_role key secret (never commit to git)
- [ ] Enable 2FA on Supabase account
- [ ] Review RLS policies
- [ ] Setup regular backups
- [ ] Monitor Supabase usage
- [ ] Use strong passwords for all users
- [ ] Enable email verification (Supabase Auth settings)

## Performance Optimization

- [ ] Enable Supabase connection pooling
- [ ] Add database indexes (already in schema)
- [ ] Enable Next.js image optimization
- [ ] Setup CDN for static assets (Vercel automatic)
- [ ] Monitor Vercel analytics
- [ ] Optimize images before upload
- [ ] Use pagination for large lists

## Maintenance

### Weekly

- Review pending expenses
- Check storage usage
- Monitor error logs (Vercel dashboard)

### Monthly

- Export data to Excel (backup)
- Review user access
- Clean up old attachments (if needed)
- Check Supabase usage limits

### Quarterly

- Review and update master data
- Audit user roles and permissions
- Performance review
- Feature requests from users
