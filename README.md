# থিকাদারি হিসাব (Construction Contractor Accounting System)

Complete production-ready mobile-first web application for Bangladeshi construction contractor accounting with tender-wise separate accounts.

## 🎯 Overview

A comprehensive accounting system designed specifically for Bangladeshi construction contractors managing multiple tenders/projects. Features include:

- **Tender-wise Isolation**: Each project maintains completely separate accounts
- **Mobile-First**: Optimized for on-site data entry via mobile devices
- **Bangla UI**: All labels, reports, and user-facing text in Bengali
- **Role-Based Access**: 7 user roles with granular permissions
- **Complete Tracking**: Labor, materials, activities, advances, expenses
- **Print-Ready Reports**: 6 A4 reports with Bangla formatting
- **Excel Export**: Multi-sheet workbooks for external analysis
- **Secure**: Row-level security, audit trails, encrypted storage

## 🚀 Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: TailwindCSS, shadcn/ui components
- **Forms**: React Hook Form + Zod validation
- **Tables**: TanStack Table
- **Database**: Supabase (PostgreSQL + Auth + Storage + RLS)
- **Deployment**: Vercel
- **Language**: Bangla UI, English database columns

## 📋 Features

### Core Modules

1. **Labor Management**

   - Contract/crew-based (khoraki system)
   - Daily labor (wage-based)
   - Work type categorization
   - Headcount tracking

2. **Materials & Purchases**

   - Standard item purchases
   - Bulk breakdown for sand/stone (cft-based with transport + unloading)
   - Supplier tracking
   - Payment method recording

3. **Activity/Work Expenses**

   - Extensive categories (road, concrete, equipment, transport, etc.)
   - Mini-BOQ style entries (qty × rate)
   - Vendor tracking
   - Receipt attachments

4. **Advances & Settlement**

   - Give advances to site persons
   - Submit expenses against advances
   - Approval workflow
   - Auto-calculated ledgers
   - Timeline with running balance

5. **Dashboard & Analytics**

   - Real-time summary (today, week, month, total)
   - Breakdown by category
   - Recent entries
   - Pending approvals

6. **Reports & Export**
   - Daily Sheet
   - Labor Register
   - Materials Register
   - Activity Register
   - Advance Ledger
   - Tender Summary
   - Excel export (8 sheets)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Supabase account (free tier works)
- npm or yarn

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Setup environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 3. Setup Supabase database
# - Go to Supabase SQL Editor
# - Run docs/03_DATABASE_SCHEMA.sql
# - Run docs/04_RLS_POLICIES.sql
# - Run docs/05_SEED_DATA.sql

# 4. Start development server
npm run dev

# 5. Open http://localhost:3000
```

### First-Time Setup

1. Create admin user in Supabase Authentication
2. Update user role to 'owner' in profiles table
3. Login and create your first tender
4. Assign users to tender
5. Start adding entries!

**See `docs/SETUP_GUIDE.md` for detailed instructions.**

## 📚 Documentation

| Document                                                    | Description                               |
| ----------------------------------------------------------- | ----------------------------------------- |
| [Complete Specification](docs/00_COMPLETE_SPECIFICATION.md) | Full system overview and summary          |
| [Overview](docs/01_OVERVIEW.md)                             | What the app does, users, constraints     |
| [Sitemap](docs/02_SITEMAP.md)                               | All routes and pages                      |
| [Database Schema](docs/03_DATABASE_SCHEMA.sql)              | PostgreSQL schema with indexes            |
| [RLS Policies](docs/04_RLS_POLICIES.sql)                    | Row-level security rules                  |
| [Seed Data](docs/05_SEED_DATA.sql)                          | Default materials, categories, work types |
| [UI/UX Design](docs/06_UI_UX_DESIGN.md)                     | Mobile-first design, components, screens  |
| [Workflows](docs/07_WORKFLOWS.md)                           | Step-by-step user workflows               |
| [Reports](docs/08_REPORTS_SPEC.md)                          | A4 print-ready report specifications      |
| [Excel Export](docs/09_EXCEL_EXPORT.md)                     | Multi-sheet workbook design               |
| [Implementation](docs/10_IMPLEMENTATION.md)                 | Code structure and key files              |
| [Setup Guide](docs/SETUP_GUIDE.md)                          | Installation and deployment guide         |

## 🎨 Key Features Explained

### Tender-Wise Isolation

Every piece of data is scoped by `tender_id`. Users are assigned to specific tenders and can only see/edit data for their assigned tenders. Perfect for contractors managing multiple projects simultaneously.

### Bulk Breakdown for Materials

Special handling for sand/stone purchases common in Bangladesh:

- Base cost: quantity (cft) × rate per cft
- Transport vara cost (lumpsum)
- Unloading cost: quantity × unload rate (3-4 tk/cft)
- Grand total auto-calculated

### Advance & Settlement System

Track money flow to site persons:

1. Give advance (cash/bank/MFS)
2. Person submits expenses with receipts
3. Accountant approves/rejects
4. Ledger auto-updates with running balance
5. Settlement when balance reaches zero

### Mobile-First Data Entry

- Bottom navigation on mobile
- Quick Add FAB for fast entry
- Camera integration for receipts
- Touch-friendly forms
- Offline support (future)

## 🔒 Security

- **Row-Level Security (RLS)**: All tables protected
- **Role-Based Access**: 7 roles with granular permissions
- **Tender Scoping**: Users only see assigned tenders
- **Audit Trail**: All changes logged with user/timestamp
- **Secure Storage**: Receipts in private Supabase bucket
- **Auth**: Supabase authentication with email/password

## 📊 User Roles

1. **Owner/Admin**: Full system access
2. **Accountant**: Financial oversight, approvals
3. **Site Manager**: Day-to-day operations
4. **Site Engineer**: Technical oversight
5. **Foreman**: Labor management
6. **Driver**: Submit fuel/maintenance expenses
7. **Viewer/Auditor**: Read-only access

## 🌐 Deployment

### Vercel (Recommended)

```bash
# 1. Push to GitHub
git init
git add .
git commit -m "Initial commit"
git push

# 2. Import to Vercel
# - Connect GitHub repo
# - Add environment variables
# - Deploy

# 3. Update Supabase Auth URLs
# - Add Vercel domain to redirect URLs
```

See `docs/SETUP_GUIDE.md` for detailed deployment instructions.

## 🧪 Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Type check
npm run type-check

# Build for production
npm run build

# Start production server
npm start
```

## 📱 Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari (iOS 12+)
- Mobile browsers (Android 8+, iOS 12+)

## 🤝 Contributing

This is a complete specification and implementation scaffold. To extend:

1. Follow existing patterns in `app/` and `components/`
2. Add new routes in App Router structure
3. Create Zod schemas for validation
4. Update database schema if needed
5. Add RLS policies for new tables
6. Update documentation

## 📄 License

MIT License - Feel free to use for your projects

## 🙏 Acknowledgments

- Built with Next.js, Supabase, and shadcn/ui
- Designed for Bangladeshi construction industry
- Bangla language support via Google Fonts (Noto Sans Bengali)

## 📞 Support

For issues, questions, or feature requests:

- Check documentation in `docs/` folder
- Review `docs/SETUP_GUIDE.md` for troubleshooting
- See `docs/07_WORKFLOWS.md` for usage examples

---

**Ready to deploy and use immediately!** 🚀

Start with `docs/SETUP_GUIDE.md` for step-by-step instructions.
#   t h i k a d a r - h i h s a b  
 