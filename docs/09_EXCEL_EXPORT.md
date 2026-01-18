# Section 8: Excel Export Design (xlsx)

## Export Endpoint

`GET /api/tender/[tenderId]/export?from=YYYY-MM-DD&to=YYYY-MM-DD`

## Library

Use `xlsx` (SheetJS) for Excel generation.

```bash
npm install xlsx
```

## Workbook Structure

### Sheet 1: Summary (সারসংক্ষেপ)

**Layout:**

```
Row 1: টেন্ডার সারসংক্ষেপ (Tender Summary)
Row 2: [blank]
Row 3: টেন্ডার কোড: | ABC-2024-001
Row 4: প্রকল্পের নাম: | ঢাকা-চট্টগ্রাম মহাসড়ক সংস্কার
Row 5: স্থান: | কুমিল্লা
Row 6: তারিখ পরিসীমা: | ০১/০১/২০২৪ - ৩১/০১/২০২৪
Row 7: [blank]
Row 8: বিভাগ | পরিমাণ (টাকা) | শতাংশ (%)
Row 9: শ্রমিক খরচ | 123,456 | 22.6%
Row 10: মালামাল | 289,012 | 53.0%
Row 11: কাজের খরচ | 133,210 | 24.4%
Row 12: মোট | 545,678 | 100.0%
Row 13: [blank]
Row 14: অগ্রিম প্রদান | 85,000
Row 15: খরচ জমা | 48,500
Row 16: বাকি অগ্রিম | 36,500
```

**Formatting:**

- Row 1: Bold, 14pt, centered, merged cells
- Headers (Row 8): Bold, background color #4472C4, white text
- Numbers: Thousand separator, 2 decimal places
- Percentages: 1 decimal place

### Sheet 2: Labor (শ্রমিক)

**Columns:**
| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| ক্রমিক | তারিখ | ধরন | দল/শ্রমিকের নাম | কাজের ধরন | লোক সংখ্যা | খোরাকি | মজুরি | মোট | নোট |

**Data Rows:**

- One row per labor entry
- Date format: DD/MM/YYYY
- Numbers: Thousand separator

**Summary Row (Last):**

- Merged cells for "মোট"
- SUM formulas for numeric columns
- Bold, background color #D9E1F2

**Column Widths:**

- A: 8, B: 12, C: 10, D: 20, E: 15, F: 10, G-I: 12, J: 30

### Sheet 3: Materials (মালামাল)

**Columns:**
| A | B | C | D | E | F | G | H | I | J | K | L |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ক্রমিক | তারিখ | মালামাল | পরিমাণ | একক | দর | মোট | বাল্ক? | মূল খরচ | পরিবহন | খালাস | সরবরাহকারী |

**Special Handling:**

- Column H (বাল্ক?): "হ্যাঁ" or "না"
- Columns I-K: Only filled if bulk breakdown
- Conditional formatting: Highlight bulk entries in light yellow

**Summary Row:**

- Total amount
- Count of entries
- Count of bulk entries

### Sheet 4: ActivityExpenses (কাজের খরচ)

**Columns:**
| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| ক্রমিক | তারিখ | বিভাগ | উপ-বিভাগ | বিবরণ | পরিমাণ | একক | দর | মোট | বিক্রেতা |

**Summary Section (After data):**

- Blank row
- "বিভাগ অনুযায়ী সারসংক্ষেপ" (Summary by Category)
- Pivot-style summary:
  - Category | Total Amount
  - One row per category
  - Grand total

### Sheet 5: Advances (অগ্রিম)

**Columns:**
| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| ক্রমিক | তারিখ | ব্যক্তি | ভূমিকা | পরিমাণ | পদ্ধতি | উদ্দেশ্য | প্রদানকারী |

**Summary Row:**

- Total advances
- Count by payment method

### Sheet 6: Expenses (খরচ জমা)

**Columns:**
| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| ক্রমিক | তারিখ | জমাদাতা | বিভাগ | বিবরণ | পরিমাণ | অবস্থা | অনুমোদনকারী | অনুমোদনের তারিখ |

**Conditional Formatting:**

- Status column:
  - "অনুমোদিত" (Approved): Green background
  - "অপেক্ষমাণ" (Pending): Orange background
  - "প্রত্যাখ্যাত" (Rejected): Red background

**Summary:**

- Total by status
- Total approved amount
- Total pending amount

### Sheet 7: PersonLedgers (ব্যক্তিভিত্তিক হিসাব)

**Columns:**
| A | B | C | D | E | F |
|---|---|---|---|---|---|
| ক্রমিক | ব্যক্তি | ভূমিকা | মোট অগ্রিম | মোট খরচ | বর্তমান ব্যালেন্স |

**Conditional Formatting:**

- Balance column:
  - Positive (person owes): Light green
  - Negative (company owes): Light red
  - Zero: White

**Summary Row:**

- Total advances
- Total expenses
- Net balance

### Sheet 8: AttachmentsIndex (সংযুক্তি তালিকা)

**Columns:**
| A | B | C | D | E | F |
|---|---|---|---|---|---|
| ক্রমিক | তারিখ | ধরন | এন্ট্রি বিবরণ | ফাইলের নাম | ডাউনলোড লিংক |

**Data:**

- One row per attachment
- Download link: Supabase Storage signed URL (valid 1 hour)
- Hyperlink formula: `=HYPERLINK(F2, "ডাউনলোড")`

**Summary:**

- Total attachments
- Total file size (MB)

## Implementation Code Structure

```typescript
// app/api/tender/[tenderId]/export/route.ts

import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { tenderId: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  // Fetch all data
  const [
    tender,
    labor,
    materials,
    activities,
    advances,
    expenses,
    ledgers,
    attachments,
  ] = await Promise.all([
    fetchTender(params.tenderId),
    fetchLabor(params.tenderId, from, to),
    fetchMaterials(params.tenderId, from, to),
    fetchActivities(params.tenderId, from, to),
    fetchAdvances(params.tenderId, from, to),
    fetchExpenses(params.tenderId, from, to),
    fetchLedgers(params.tenderId),
    fetchAttachments(params.tenderId, from, to),
  ]);

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Sheet 1: Summary
  const summarySheet = createSummarySheet(
    tender,
    labor,
    materials,
    activities,
    advances,
    expenses
  );
  XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

  // Sheet 2: Labor
  const laborSheet = createLaborSheet(labor);
  XLSX.utils.book_append_sheet(wb, laborSheet, "Labor");

  // Sheet 3: Materials
  const materialsSheet = createMaterialsSheet(materials);
  XLSX.utils.book_append_sheet(wb, materialsSheet, "Materials");

  // Sheet 4: Activities
  const activitiesSheet = createActivitiesSheet(activities);
  XLSX.utils.book_append_sheet(wb, activitiesSheet, "Activities");

  // Sheet 5: Advances
  const advancesSheet = createAdvancesSheet(advances);
  XLSX.utils.book_append_sheet(wb, advancesSheet, "Advances");

  // Sheet 6: Expenses
  const expensesSheet = createExpensesSheet(expenses);
  XLSX.utils.book_append_sheet(wb, expensesSheet, "Expenses");

  // Sheet 7: Ledgers
  const ledgersSheet = createLedgersSheet(ledgers);
  XLSX.utils.book_append_sheet(wb, ledgersSheet, "Ledgers");

  // Sheet 8: Attachments
  const attachmentsSheet = createAttachmentsSheet(attachments);
  XLSX.utils.book_append_sheet(wb, attachmentsSheet, "Attachments");

  // Generate buffer
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  // Return file
  const filename = `Tender_${tender.tender_code}_${from}_${to}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function createSummarySheet(
  tender,
  labor,
  materials,
  activities,
  advances,
  expenses
) {
  const laborTotal = labor.reduce(
    (sum, l) => sum + (l.khoraki_total || 0) + (l.wage_total || 0),
    0
  );
  const materialsTotal = materials.reduce((sum, m) => sum + m.total_amount, 0);
  const activitiesTotal = activities.reduce((sum, a) => sum + a.amount, 0);
  const grandTotal = laborTotal + materialsTotal + activitiesTotal;

  const advancesTotal = advances.reduce((sum, a) => sum + a.amount, 0);
  const expensesTotal = expenses
    .filter((e) => e.status === "approved")
    .reduce((sum, e) => sum + e.amount, 0);

  const data = [
    ["টেন্ডার সারসংক্ষেপ"],
    [],
    ["টেন্ডার কোড:", tender.tender_code],
    ["প্রকল্পের নাম:", tender.project_name],
    ["স্থান:", tender.location],
    ["তারিখ পরিসীমা:", `${from} - ${to}`],
    [],
    ["বিভাগ", "পরিমাণ (টাকা)", "শতাংশ (%)"],
    [
      "শ্রমিক খরচ",
      laborTotal,
      ((laborTotal / grandTotal) * 100).toFixed(1) + "%",
    ],
    [
      "মালামাল",
      materialsTotal,
      ((materialsTotal / grandTotal) * 100).toFixed(1) + "%",
    ],
    [
      "কাজের খরচ",
      activitiesTotal,
      ((activitiesTotal / grandTotal) * 100).toFixed(1) + "%",
    ],
    ["মোট", grandTotal, "100.0%"],
    [],
    ["অগ্রিম প্রদান", advancesTotal],
    ["খরচ জমা", expensesTotal],
    ["বাকি অগ্রিম", advancesTotal - expensesTotal],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Apply formatting (column widths, etc.)
  ws["!cols"] = [{ wch: 20 }, { wch: 15 }, { wch: 12 }];

  return ws;
}

function createLaborSheet(labor) {
  const headers = [
    "ক্রমিক",
    "তারিখ",
    "ধরন",
    "দল/শ্রমিকের নাম",
    "কাজের ধরন",
    "লোক সংখ্যা",
    "খোরাকি",
    "মজুরি",
    "মোট",
    "নোট",
  ];

  const rows = labor.map((l, i) => [
    i + 1,
    formatDate(l.entry_date),
    l.labor_type === "contract" ? "চুক্তি" : "দৈনিক",
    l.crew_name || l.labor_name || "-",
    l.work_type_name_bn || "-",
    l.headcount || "-",
    l.khoraki_total || 0,
    l.wage_total || 0,
    (l.khoraki_total || 0) + (l.wage_total || 0),
    l.notes || "",
  ]);

  const totalRow = [
    "",
    "",
    "",
    "",
    "",
    labor.reduce((sum, l) => sum + (l.headcount || 0), 0),
    labor.reduce((sum, l) => sum + (l.khoraki_total || 0), 0),
    labor.reduce((sum, l) => sum + (l.wage_total || 0), 0),
    labor.reduce(
      (sum, l) => sum + (l.khoraki_total || 0) + (l.wage_total || 0),
      0
    ),
    "মোট",
  ];

  const data = [headers, ...rows, totalRow];
  const ws = XLSX.utils.aoa_to_sheet(data);

  ws["!cols"] = [
    { wch: 8 },
    { wch: 12 },
    { wch: 10 },
    { wch: 20 },
    { wch: 15 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 30 },
  ];

  return ws;
}

// Similar functions for other sheets...
```

## Download Trigger (Frontend)

```typescript
// components/ExportButton.tsx

"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useState } from "react";

export function ExportButton({
  tenderId,
  from,
  to,
}: {
  tenderId: string;
  from: string;
  to: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/tender/${tenderId}/export?from=${from}&to=${to}`
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Tender_${tenderId}_${from}_${to}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export failed:", error);
      alert("এক্সপোর্ট ব্যর্থ হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleExport} disabled={loading}>
      <Download className="mr-2 h-4 w-4" />
      {loading ? "ডাউনলোড হচ্ছে..." : "এক্সেল ডাউনলোড"}
    </Button>
  );
}
```

## Computed Totals & Formulas

For dynamic Excel formulas (instead of hardcoded values):

```typescript
// Use XLSX formula syntax
const summaryRow = [
  "",
  "",
  "",
  "",
  "",
  { f: `SUM(F2:F${rows.length + 1})` }, // Headcount
  { f: `SUM(G2:G${rows.length + 1})` }, // Khoraki
  { f: `SUM(H2:H${rows.length + 1})` }, // Wage
  { f: `SUM(I2:I${rows.length + 1})` }, // Total
  "মোট",
];
```

This allows Excel to recalculate if user modifies data.
