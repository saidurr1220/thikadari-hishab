import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import PrintButton from "./PrintButton";

// Disable caching for fresh data
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LedgerSummaryPage({
  params,
  searchParams,
}: {
  params: { tenderId: string };
  searchParams: { from?: string; to?: string };
}) {
  const supabase = createClient();

  // Get date range (default: last 30 days)
  const toDate = searchParams.to || new Date().toISOString().split("T")[0];
  const fromDate =
    searchParams.from ||
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  // Get tender info
  const { data: tender } = await supabase
    .from("tenders")
    .select("*")
    .eq("id", params.tenderId)
    .single();

  // Get all expenses by category (Khata)
  const { data: labor } = await supabase
    .from("labor_entries")
    .select("khoraki_total, wage_total, entry_date")
    .eq("tender_id", params.tenderId)
    .gte("entry_date", fromDate)
    .lte("entry_date", toDate);

  const { data: materials } = await supabase
    .from("material_purchases")
    .select("total_amount, purchase_date")
    .eq("tender_id", params.tenderId)
    .gte("purchase_date", fromDate)
    .lte("purchase_date", toDate);

  // Get vendor purchases (bricks, sand, rod, cement etc.)
  const { data: vendorPurchases } = await supabase
    .from("vendor_purchases")
    .select("total_amount, purchase_date")
    .eq("tender_id", params.tenderId)
    .gte("purchase_date", fromDate)
    .lte("purchase_date", toDate);

  const { data: activities } = await supabase
    .from("activity_expenses")
    .select("amount, expense_date, expense_categories!left(name_bn)")
    .eq("tender_id", params.tenderId)
    .gte("expense_date", fromDate)
    .lte("expense_date", toDate);

  // Get personal advances (NOT general advances like bank/MFS)
  const { data: personAdvancesOnly } = await supabase
    .from("person_advances")
    .select("amount, advance_date")
    .eq("tender_id", params.tenderId)
    .gte("advance_date", fromDate)
    .lte("advance_date", toDate);

  // Get person-wise advance and expense breakdown
  const { data: personAdvances } = await supabase
    .from("person_advances")
    .select(
      `
      *,
      person:persons!person_advances_person_id_fkey (full_name)
    `
    )
    .eq("tender_id", params.tenderId)
    .gte("advance_date", fromDate)
    .lte("advance_date", toDate);

  const { data: personExpenses } = await supabase
    .from("person_expenses")
    .select(
      `
      *,
      person:persons!person_expenses_person_id_fkey (full_name)
    `
    )
    .eq("tender_id", params.tenderId)
    .gte("expense_date", fromDate)
    .lte("expense_date", toDate);

  // Calculate person-wise summary
  const personSummary = new Map();

  personAdvances?.forEach((adv: any) => {
    const personId = adv.person_id;
    const personName = adv.person?.full_name || "Unknown";
    if (!personSummary.has(personId)) {
      personSummary.set(personId, {
        name: personName,
        advances: 0,
        expenses: 0,
        balance: 0,
      });
    }
    const summary = personSummary.get(personId);
    summary.advances += Number(adv.amount || 0);
    summary.balance += Number(adv.amount || 0);
  });

  personExpenses?.forEach((exp: any) => {
    const personId = exp.person_id;
    const personName = exp.person?.full_name || "Unknown";
    if (!personSummary.has(personId)) {
      personSummary.set(personId, {
        name: personName,
        advances: 0,
        expenses: 0,
        balance: 0,
      });
    }
    const summary = personSummary.get(personId);
    summary.expenses += Number(exp.amount || 0);
    summary.balance -= Number(exp.amount || 0);
  });

  const personList = Array.from(personSummary.values());
  const personListForPrint = personList;

  // Calculate totals
  const laborTotal =
    labor?.reduce(
      (sum, l) =>
        sum + Number(l.khoraki_total || 0) + Number(l.wage_total || 0),
      0
    ) || 0;

  const materialsTotal =
    materials?.reduce((sum, m) => sum + Number(m.total_amount || 0), 0) || 0;

  const vendorPurchasesTotal =
    vendorPurchases?.reduce((sum, v) => sum + Number(v.total_amount || 0), 0) ||
    0;

  const activitiesTotal =
    activities?.reduce((sum, a) => sum + Number(a.amount || 0), 0) || 0;

  const grandTotal =
    laborTotal + materialsTotal + vendorPurchasesTotal + activitiesTotal;

  // Group activities by category
  const activitiesByCategory = activities?.reduce((acc: any, a) => {
    const cat = (a.expense_categories as any)?.name_bn || "অন্যান্য";
    if (!acc[cat]) {
      acc[cat] = { total: 0, count: 0 };
    }
    acc[cat].total += Number(a.amount || 0);
    acc[cat].count += 1;
    return acc;
  }, {});

  // Create Khata summary
  const khataList = [
    {
      name: "শ্রমিক খাতা",
      name_en: "Labor Account",
      total: laborTotal,
      count: labor?.length || 0,
      icon: "👷",
      color: "blue",
    },
    {
      name: "মালামাল খাতা",
      name_en: "Materials Account",
      total: materialsTotal,
      count: materials?.length || 0,
      icon: "🧱",
      color: "green",
    },
    {
      name: "ভেন্ডর ক্রয়",
      name_en: "Vendor Purchases",
      total: vendorPurchasesTotal,
      count: vendorPurchases?.length || 0,
      icon: "🏪",
      color: "purple",
    },
    {
      name: "ব্যক্তিগত অগ্রিম",
      name_en: "Personal Advances",
      total:
        personAdvancesOnly?.reduce(
          (sum, a) => sum + Number(a.amount || 0),
          0
        ) || 0,
      count: personAdvancesOnly?.length || 0,
      icon: "💰",
      color: "yellow",
    },
  ];

  // Add activity categories as separate khatas
  if (activitiesByCategory) {
    Object.entries(activitiesByCategory).forEach(
      ([cat, data]: [string, any]) => {
        khataList.push({
          name: `${cat} খাতা`,
          name_en: `${cat} Account`,
          total: data.total,
          count: data.count,
          icon: "🔧",
          color: "purple",
        });
      }
    );
  }

  // Sort by total (descending)
  khataList.sort((a, b) => b.total - a.total);

  const daysDiff = Math.ceil(
    (new Date(toDate).getTime() - new Date(fromDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Navigation - Hidden on print */}
        <div className="mb-6 no-print">
          <Link
            href={`/tender/${params.tenderId}`}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            ← টেন্ডার ড্যাশবোর্ড
          </Link>
        </div>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100 print:shadow-none print:border-2 print:border-gray-800 print:rounded-none print:mb-4 print:p-4">
          <div className="flex justify-between items-start mb-4 print:mb-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 print:text-2xl print:mb-1">
                খাতা সারসংক্ষেপ
              </h1>
              <p className="text-gray-600 print:text-black print:text-sm">
                {tender?.project_name} • {tender?.tender_code}
              </p>
            </div>
            <div className="flex gap-3 items-start">
              <div className="no-print">
                <PrintButton />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 print:text-black print:text-xs">
                  সময়কাল
                </p>
                <p className="font-semibold print:text-sm">
                  {formatDate(fromDate)} - {formatDate(toDate)}
                </p>
                <p className="text-sm text-gray-600 mt-1 print:text-black print:text-xs print:mt-0">
                  {daysDiff} দিন
                </p>
              </div>
            </div>
          </div>

          {/* Grand Total */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white print:bg-gray-100 print:text-black print:border-2 print:border-gray-800 print:p-3 print:rounded-none">
            <p className="text-sm opacity-90 mb-1 print:opacity-100 print:font-semibold print:text-xs">
              মোট খরচ
            </p>
            <p className="text-4xl font-bold print:text-2xl">
              {formatCurrency(grandTotal)}
            </p>
            <p className="text-sm opacity-90 mt-2 print:opacity-100 print:text-xs print:mt-1">
              দৈনিক গড়: {formatCurrency(grandTotal / daysDiff)}
            </p>
          </div>
        </div>

        {/* Khata Cards - Hidden on print, replaced by compact table */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 no-print">
          {khataList.map((khata, idx) => (
            <Card
              key={idx}
              className="hover:shadow-lg transition-shadow border-l-4"
              style={{
                borderLeftColor:
                  khata.color === "blue"
                    ? "#3b82f6"
                    : khata.color === "green"
                    ? "#10b981"
                    : khata.color === "yellow"
                    ? "#f59e0b"
                    : "#8b5cf6",
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{khata.icon}</span>
                  <span className="text-xs font-medium text-gray-500">
                    {khata.count} এন্ট্রি
                  </span>
                </div>
                <CardTitle className="text-lg mt-2">{khata.name}</CardTitle>
                <p className="text-xs text-gray-500">{khata.name_en}</p>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(khata.total)}
                </p>
                <div className="mt-3 pt-3 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">মোট খরচের</span>
                    <span className="font-semibold text-blue-600">
                      {((khata.total / grandTotal) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-600">দৈনিক গড়</span>
                    <span className="font-semibold">
                      {formatCurrency(khata.total / daysDiff)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed Breakdown Table */}
        <Card className="mb-6 print:shadow-none print:border-2 print:border-gray-800 print:rounded-none">
          <CardHeader className="print:pb-1 print:pt-2">
            <CardTitle className="print:text-base">বিস্তারিত হিসাব</CardTitle>
          </CardHeader>
          <CardContent className="print:p-2">
            <div className="overflow-x-auto">
              <table className="w-full print:text-xs">
                <thead>
                  <tr className="border-b-2">
                    <th className="text-left py-3 px-4 print:py-1 print:px-2">
                      খাতার নাম
                    </th>
                    <th className="text-right py-3 px-4 print:py-1 print:px-2">
                      এন্ট্রি সংখ্যা
                    </th>
                    <th className="text-right py-3 px-4 print:py-1 print:px-2">
                      মোট টাকা
                    </th>
                    <th className="text-right py-3 px-4 print:py-1 print:px-2">
                      শতাংশ
                    </th>
                    <th className="text-right py-3 px-4 print:py-1 print:px-2">
                      দৈনিক গড়
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {khataList.map((khata, idx) => (
                    <tr
                      key={idx}
                      className="border-b hover:bg-gray-50 print:hover:bg-transparent"
                    >
                      <td className="py-3 px-4 print:py-1 print:px-2">
                        <div className="flex items-center gap-2 print:gap-1">
                          <span className="text-xl print:text-base">
                            {khata.icon}
                          </span>
                          <div>
                            <p className="font-semibold print:text-xs">
                              {khata.name}
                            </p>
                            <p className="text-xs text-gray-500 print:hidden">
                              {khata.name_en}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 text-gray-600 print:py-1 print:px-2 print:text-black">
                        {khata.count}
                      </td>
                      <td className="text-right py-3 px-4 font-semibold print:py-1 print:px-2">
                        {formatCurrency(khata.total)}
                      </td>
                      <td className="text-right py-3 px-4 print:py-1 print:px-2">
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium print:px-1 print:py-0 print:bg-transparent print:text-black print:text-xs">
                          {((khata.total / grandTotal) * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-right py-3 px-4 text-gray-600 print:py-1 print:px-2 print:text-black">
                        {formatCurrency(khata.total / daysDiff)}
                      </td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-gray-50 border-t-2 print:bg-transparent">
                    <td className="py-3 px-4 print:py-1 print:px-2">সর্বমোট</td>
                    <td className="text-right py-3 px-4 print:py-1 print:px-2">
                      {khataList.reduce((sum, k) => sum + k.count, 0)}
                    </td>
                    <td className="text-right py-3 px-4 print:py-1 print:px-2">
                      {formatCurrency(grandTotal)}
                    </td>
                    <td className="text-right py-3 px-4 print:py-1 print:px-2">
                      100%
                    </td>
                    <td className="text-right py-3 px-4 print:py-1 print:px-2">
                      {formatCurrency(grandTotal / daysDiff)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Person-wise Breakdown */}
        {personList.length > 0 && (
          <Card className="mb-6 print:shadow-none print:border-2 print:border-gray-800 print:rounded-none">
            <CardHeader className="print:pb-1 print:pt-2">
              <CardTitle className="print:text-base">
                ব্যক্তিভিত্তিক অগ্রিম ও খরচ
              </CardTitle>
            </CardHeader>
            <CardContent className="print:p-2">
              <div className="overflow-x-auto">
                <table className="w-full print:text-xs">
                  <thead>
                    <tr className="border-b-2">
                      <th className="text-left py-3 px-4 print:py-1 print:px-2">
                        ব্যক্তির নাম
                      </th>
                      <th className="text-right py-3 px-4 print:py-1 print:px-2">
                        অগ্রিম
                      </th>
                      <th className="text-right py-3 px-4 print:py-1 print:px-2">
                        খরচ
                      </th>
                      <th className="text-right py-3 px-4 print:py-1 print:px-2">
                        ব্যালেন্স
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {personListForPrint.map((person: any, idx: number) => (
                      <tr
                        key={idx}
                        className="border-b hover:bg-gray-50 print:hover:bg-transparent"
                      >
                        <td className="py-3 px-4 print:py-1 print:px-2 font-medium">
                          {person.name}
                        </td>
                        <td className="text-right py-3 px-4 print:py-1 print:px-2 text-green-700 print:text-black">
                          {formatCurrency(person.advances)}
                        </td>
                        <td className="text-right py-3 px-4 print:py-1 print:px-2 text-red-700 print:text-black">
                          {formatCurrency(person.expenses)}
                        </td>
                        <td className="text-right py-3 px-4 print:py-1 print:px-2 font-semibold">
                          <span
                            className={
                              person.balance >= 0
                                ? "text-green-700 print:text-black"
                                : "text-red-700 print:text-black"
                            }
                          >
                            {formatCurrency(Math.abs(person.balance))}
                            {person.balance < 0 ? " (পাবে)" : " (বাকি)"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr className="font-bold bg-gray-50 border-t-2 print:bg-transparent">
                      <td className="py-3 px-4 print:py-1 print:px-2">
                        সর্বমোট
                      </td>
                      <td className="text-right py-3 px-4 print:py-1 print:px-2">
                        {formatCurrency(
                          personListForPrint.reduce(
                            (sum: number, p: any) => sum + p.advances,
                            0
                          )
                        )}
                      </td>
                      <td className="text-right py-3 px-4 print:py-1 print:px-2">
                        {formatCurrency(
                          personListForPrint.reduce(
                            (sum: number, p: any) => sum + p.expenses,
                            0
                          )
                        )}
                      </td>
                      <td className="text-right py-3 px-4 print:py-1 print:px-2">
                        {formatCurrency(
                          personListForPrint.reduce(
                            (sum: number, p: any) => sum + p.balance,
                            0
                          )
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Date Range Filter */}
        <Card className="mt-8 no-print">
          <CardHeader>
            <CardTitle>সময়কাল পরিবর্তন করুন</CardTitle>
          </CardHeader>
          <CardContent>
            <form method="get" className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">
                  শুরুর তারিখ
                </label>
                <input
                  type="date"
                  name="from"
                  defaultValue={fromDate}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">
                  শেষ তারিখ
                </label>
                <input
                  type="date"
                  name="to"
                  defaultValue={toDate}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                দেখুন
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
