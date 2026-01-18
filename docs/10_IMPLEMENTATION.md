# Section 9: Implementation Skeleton

## Project Structure

```
thikadari-hisab/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (protected)/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── tender/
│   │   │   └── [tenderId]/
│   │   │       ├── page.tsx (Dashboard)
│   │   │       ├── labor/
│   │   │       │   ├── page.tsx
│   │   │       │   ├── add/
│   │   │       │   │   └── page.tsx
│   │   │       │   └── [entryId]/
│   │   │       │       └── page.tsx
│   │   │       ├── materials/
│   │   │       │   ├── page.tsx
│   │   │       │   ├── add/
│   │   │       │   │   └── page.tsx
│   │   │       │   └── add-bulk/
│   │   │       │       └── page.tsx
│   │   │       ├── activities/
│   │   │       │   ├── page.tsx
│   │   │       │   └── add/
│   │   │       │       └── page.tsx
│   │   │       ├── advances/
│   │   │       │   ├── page.tsx
│   │   │       │   └── give/
│   │   │       │       └── page.tsx
│   │   │       ├── expenses/
│   │   │       │   ├── page.tsx
│   │   │       │   ├── submit/
│   │   │       │   │   └── page.tsx
│   │   │       │   └── [expenseId]/
│   │   │       │       └── page.tsx
│   │   │       ├── ledger/
│   │   │       │   └── [personId]/
│   │   │       │       └── page.tsx
│   │   │       └── reports/
│   │   │           ├── page.tsx
│   │   │           ├── daily/
│   │   │           │   └── page.tsx
│   │   │           ├── labor/
│   │   │           │   └── page.tsx
│   │   │           ├── materials/
│   │   │           │   └── page.tsx
│   │   │           ├── activities/
│   │   │           │   └── page.tsx
│   │   │           ├── advances/
│   │   │           │   └── page.tsx
│   │   │           └── summary/
│   │   │               └── page.tsx
│   │   ├── admin/
│   │   │   ├── tenders/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [tenderId]/
│   │   │   │       └── assign/
│   │   │   │           └── page.tsx
│   │   │   ├── users/
│   │   │   │   └── page.tsx
│   │   │   └── masters/
│   │   │       ├── materials/
│   │   │       │   └── page.tsx
│   │   │       ├── categories/
│   │   │       │   └── page.tsx
│   │   │       └── work-types/
│   │   │           └── page.tsx
│   │   ├── settings/
│   │   │   ├── profile/
│   │   │   │   └── page.tsx
│   │   │   └── preferences/
│   │   │       └── page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   ├── tender/
│   │   │   └── [tenderId]/
│   │   │       └── export/
│   │   │           └── route.ts
│   │   └── upload/
│   │       └── route.ts
│   ├── layout.tsx
│   ├── globals.css
│   └── page.tsx
├── components/
│   ├── ui/ (shadcn components)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── dialog.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── table.tsx
│   │   └── ...
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── BottomNav.tsx
│   │   └── TenderSwitcher.tsx
│   ├── forms/
│   │   ├── LaborEntryForm.tsx
│   │   ├── MaterialPurchaseForm.tsx
│   │   ├── BulkBreakdownForm.tsx
│   │   ├── ActivityExpenseForm.tsx
│   │   ├── AdvanceForm.tsx
│   │   └── ExpenseSubmissionForm.tsx
│   ├── shared/
│   │   ├── DateRangePicker.tsx
│   │   ├── AmountInput.tsx
│   │   ├── AttachmentUploader.tsx
│   │   ├── PersonSelector.tsx
│   │   ├── StatusBadge.tsx
│   │   └── ConfirmDialog.tsx
│   ├── dashboard/
│   │   ├── SummaryCard.tsx
│   │   ├── BreakdownChart.tsx
│   │   └── RecentEntries.tsx
│   ├── reports/
│   │   ├── ReportHeader.tsx
│   │   ├── DailySheetReport.tsx
│   │   ├── LaborRegisterReport.tsx
│   │   └── ...
│   └── QuickAddFAB.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── validations/
│   │   ├── labor.ts
│   │   ├── material.ts
│   │   ├── activity.ts
│   │   └── advance.ts
│   ├── utils/
│   │   ├── format.ts
│   │   ├── calculations.ts
│   │   └── bangla.ts
│   ├── hooks/
│   │   ├── useTender.ts
│   │   ├── useLabor.ts
│   │   ├── useMaterials.ts
│   │   └── useAuth.ts
│   └── types/
│       ├── database.types.ts
│       └── index.ts
├── public/
│   ├── fonts/
│   │   └── NotoSansBengali/
│   └── images/
├── docs/ (all specification files)
├── .env.example
├── .env.local
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

## Key Implementation Files

### 1. Environment Variables (`.env.example`)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Supabase Client (`lib/supabase/client.ts`)

```typescript
import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/lib/types/database.types";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### 3. Supabase Server Client (`lib/supabase/server.ts`)

```typescript
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/lib/types/database.types";

export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle cookie setting errors
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            // Handle cookie removal errors
          }
        },
      },
    }
  );
}
```

### 4. Auth Middleware (`middleware.ts`)

```typescript
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes
  if (
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/tender") ||
    request.nextUrl.pathname.startsWith("/admin") ||
    request.nextUrl.pathname.startsWith("/settings")
  ) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Auth routes (redirect if already logged in)
  if (
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup")
  ) {
    if (user) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

### 5. Bangla Labels Dictionary (`lib/utils/bangla.ts`)

```typescript
export const labels = {
  // Common
  save: "সংরক্ষণ করুন",
  cancel: "বাতিল",
  delete: "মুছুন",
  edit: "সম্পাদনা",
  view: "দেখুন",
  download: "ডাউনলোড",
  print: "প্রিন্ট করুন",
  search: "খুঁজুন",
  filter: "ফিল্টার",
  export: "এক্সপোর্ট",

  // Navigation
  home: "হোম",
  dashboard: "ড্যাশবোর্ড",
  labor: "শ্রমিক",
  materials: "মালামাল",
  activities: "কাজের খরচ",
  advances: "অগ্রিম",
  expenses: "খরচ",
  reports: "রিপোর্ট",
  settings: "সেটিংস",

  // Forms
  date: "তারিখ",
  amount: "পরিমাণ",
  quantity: "পরিমাণ",
  unit: "একক",
  rate: "দর",
  total: "মোট",
  description: "বিবরণ",
  notes: "নোট",
  attachments: "সংযুক্তি",

  // Labor
  laborType: "শ্রমিকের ধরন",
  contract: "চুক্তি",
  daily: "দৈনিক",
  crewName: "দলের নাম",
  laborName: "শ্রমিকের নাম",
  workType: "কাজের ধরন",
  headcount: "লোক সংখ্যা",
  khoraki: "খোরাকি",
  wage: "মজুরি",

  // Materials
  item: "মালামাল",
  supplier: "সরবরাহকারী",
  paymentMethod: "পেমেন্ট পদ্ধতি",
  paymentRef: "পেমেন্ট রেফারেন্স",
  bulkBreakdown: "বাল্ক ব্রেকডাউন",
  baseRate: "মূল দর",
  transport: "পরিবহন",
  unloading: "খালাস",

  // Activities
  category: "বিভাগ",
  subcategory: "উপ-বিভাগ",
  vendor: "বিক্রেতা",

  // Advances
  person: "ব্যক্তি",
  role: "ভূমিকা",
  purpose: "উদ্দেশ্য",
  balance: "ব্যালেন্স",

  // Status
  pending: "অপেক্ষমাণ",
  approved: "অনুমোদিত",
  rejected: "প্রত্যাখ্যাত",

  // Reports
  dailySheet: "দৈনিক শিট",
  laborRegister: "শ্রমিক খতিয়ান",
  materialsRegister: "মালামাল খতিয়ান",
  activityRegister: "কাজভিত্তিক খরচ খতিয়ান",
  advanceLedger: "অগ্রিম হিসাব",
  tenderSummary: "টেন্ডার সারসংক্ষেপ",

  // Validation
  required: "এই ফিল্ডটি আবশ্যক",
  invalidAmount: "সঠিক পরিমাণ লিখুন",
  invalidDate: "সঠিক তারিখ নির্বাচন করুন",

  // Messages
  saveSuccess: "সফলভাবে সংরক্ষিত হয়েছে",
  saveError: "সংরক্ষণ ব্যর্থ হয়েছে",
  deleteConfirm: "আপনি কি নিশ্চিত মুছতে চান?",
  deleteSuccess: "সফলভাবে মুছে ফেলা হয়েছে",
};

export function getBanglaNumber(num: number): string {
  const banglaDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return num
    .toString()
    .split("")
    .map((d) => banglaDigits[parseInt(d)] || d)
    .join("");
}

export function formatBanglaDate(date: Date): string {
  const months = [
    "জানুয়ারি",
    "ফেব্রুয়ারি",
    "মার্চ",
    "এপ্রিল",
    "মে",
    "জুন",
    "জুলাই",
    "আগস্ট",
    "সেপ্টেম্বর",
    "অক্টোবর",
    "নভেম্বর",
    "ডিসেম্বর",
  ];

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${getBanglaNumber(day)} ${month} ${getBanglaNumber(year)}`;
}

export function formatAmount(
  amount: number,
  useBangla: boolean = false
): string {
  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 2,
  })
    .format(amount)
    .replace("BDT", "৳");

  return useBangla
    ? getBanglaNumber(parseFloat(formatted.replace(/[^0-9.]/g, "")))
    : formatted;
}
```

### 6. Validation Schema Example (`lib/validations/labor.ts`)

```typescript
import { z } from "zod";

export const laborEntrySchema = z
  .object({
    tender_id: z.string().uuid(),
    entry_date: z.date(),
    labor_type: z.enum(["contract", "daily"]),
    crew_name: z.string().optional(),
    work_type_id: z.string().uuid().optional(),
    work_type_custom: z.string().optional(),
    labor_name: z.string().optional(),
    headcount: z.number().int().positive().optional(),
    khoraki_rate_per_head: z.number().positive().optional(),
    khoraki_total: z.number().positive().optional(),
    wage_total: z.number().positive().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      // At least one amount required
      return (
        (data.khoraki_total && data.khoraki_total > 0) ||
        (data.wage_total && data.wage_total > 0)
      );
    },
    {
      message: "খোরাকি বা মজুরি অন্তত একটি প্রয়োজন",
      path: ["khoraki_total"],
    }
  )
  .refine(
    (data) => {
      // Contract type requires crew name
      if (data.labor_type === "contract") {
        return !!data.crew_name;
      }
      return true;
    },
    {
      message: "দলের নাম আবশ্যক",
      path: ["crew_name"],
    }
  );

export type LaborEntryInput = z.infer<typeof laborEntrySchema>;
```

### 7. Tender Dashboard Page (`app/(protected)/tender/[tenderId]/page.tsx`)

```typescript
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { BreakdownChart } from "@/components/dashboard/BreakdownChart";
import { RecentEntries } from "@/components/dashboard/RecentEntries";
import { QuickAddFAB } from "@/components/QuickAddFAB";

export default async function TenderDashboard({
  params,
  searchParams,
}: {
  params: { tenderId: string };
  searchParams: { from?: string; to?: string };
}) {
  const supabase = createClient();

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Check tender access
  const { data: tender, error } = await supabase
    .from("tenders")
    .select("*")
    .eq("id", params.tenderId)
    .single();

  if (error || !tender) notFound();

  // Check user has access to this tender
  const { data: assignment } = await supabase
    .from("tender_assignments")
    .select("*")
    .eq("tender_id", params.tenderId)
    .eq("user_id", user.id)
    .single();

  if (!assignment) {
    // Check if admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "owner" && profile?.role !== "admin") {
      return <div>আপনার এই টেন্ডারে প্রবেশাধিকার নেই</div>;
    }
  }

  // Fetch summary data
  const from =
    searchParams.from ||
    new Date(new Date().setDate(1)).toISOString().split("T")[0];
  const to = searchParams.to || new Date().toISOString().split("T")[0];

  const [laborData, materialsData, activitiesData, advancesData] =
    await Promise.all([
      fetchLaborSummary(params.tenderId, from, to),
      fetchMaterialsSummary(params.tenderId, from, to),
      fetchActivitiesSummary(params.tenderId, from, to),
      fetchAdvancesSummary(params.tenderId, from, to),
    ]);

  return (
    <div className="container mx-auto p-4 pb-20 md:pb-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{tender.project_name}</h1>
        <p className="text-muted-foreground">{tender.tender_code}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          title="আজকের খরচ"
          amount={laborData.today + materialsData.today + activitiesData.today}
          trend={5.2}
        />
        <SummaryCard
          title="এই সপ্তাহ"
          amount={laborData.week + materialsData.week + activitiesData.week}
        />
        <SummaryCard
          title="এই মাসে"
          amount={laborData.month + materialsData.month + activitiesData.month}
        />
        <SummaryCard
          title="মোট খরচ"
          amount={laborData.total + materialsData.total + activitiesData.total}
        />
      </div>

      <BreakdownChart
        labor={laborData.total}
        materials={materialsData.total}
        activities={activitiesData.total}
      />

      <RecentEntries tenderId={params.tenderId} />

      <QuickAddFAB tenderId={params.tenderId} />
    </div>
  );
}

async function fetchLaborSummary(tenderId: string, from: string, to: string) {
  // Implementation
  return { today: 0, week: 0, month: 0, total: 0 };
}

// Similar functions for other summaries...
```

This provides the complete foundation for implementation. Continue with remaining components following this pattern.
