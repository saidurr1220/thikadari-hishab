import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/format";
import DashboardCharts from "./DashboardCharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const { data: assignments } = await supabase
    .from("tender_assignments")
    .select(
      `
      *,
      tenders (
        id,
        tender_code,
        project_name,
        location,
        is_active,
        created_at
      )
    `
    )
    .eq("user_id", user.id);

  const tenders = assignments?.map((a) => a.tenders).filter(Boolean) || [];
  const activeTenders = tenders.filter((t: any) => t.is_active);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dateFilter = thirtyDaysAgo.toISOString().split("T")[0];

  let totalExpenses = 0;
  let laborTotal = 0;
  let materialsTotal = 0;
  let activitiesTotal = 0;

  for (const tender of tenders) {
    const tenderId = (tender as any).id;

    const { data: labor } = await supabase
      .from("labor_entries")
      .select("khoraki_total, wage_total")
      .eq("tender_id", tenderId)
      .gte("entry_date", dateFilter);

    const { data: materials } = await supabase
      .from("material_purchases")
      .select("total_amount")
      .eq("tender_id", tenderId)
      .gte("purchase_date", dateFilter);

    const { data: activities } = await supabase
      .from("activity_expenses")
      .select("amount")
      .eq("tender_id", tenderId)
      .gte("expense_date", dateFilter);

    laborTotal +=
      labor?.reduce(
        (sum, l) => sum + (l.khoraki_total || 0) + (l.wage_total || 0),
        0
      ) || 0;
    materialsTotal +=
      materials?.reduce((sum, m) => sum + m.total_amount, 0) || 0;
    activitiesTotal += activities?.reduce((sum, a) => sum + a.amount, 0) || 0;
  }

  totalExpenses = laborTotal + materialsTotal + activitiesTotal;

  const expenseData = [
    { name: "শ্রমিক", value: laborTotal, color: "#3b82f6" },
    { name: "মালামাল", value: materialsTotal, color: "#10b981" },
    { name: "সাইট খরচ", value: activitiesTotal, color: "#f59e0b" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50/30 to-purple-50/20">
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Welcome Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-3">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl shadow-lg flex-shrink-0">
              <svg
                className="w-6 h-6 sm:w-8 sm:h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent truncate">
                স্বাগতম, {profile.full_name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1">
                আপনার সকল প্রজেক্টের সারসংক্ষেপ এবং হিসাব
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white border-0 shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-blue-50 flex items-center gap-1 sm:gap-2">
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="truncate">মোট টেন্ডার</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold">
                {tenders.length}
              </div>
              <p className="text-[10px] sm:text-xs text-blue-100 mt-0.5 sm:mt-1">
                সর্বমোট প্রজেক্ট
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 text-white border-0 shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-green-50 flex items-center gap-1 sm:gap-2">
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="truncate">সক্রিয় টেন্ডার</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold">
                {activeTenders.length}
              </div>
              <p className="text-[10px] sm:text-xs text-green-100 mt-0.5 sm:mt-1">
                চলমান প্রজেক্ট
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 via-purple-600 to-violet-600 text-white border-0 shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-purple-50 flex items-center gap-1 sm:gap-2">
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="truncate">ভূমিকা</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold capitalize truncate">
                {profile.role}
              </div>
              <p className="text-[10px] sm:text-xs text-purple-100 mt-0.5 sm:mt-1">
                আপনার অধিকার
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 text-white border-0 shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 col-span-2 lg:col-span-1">
            <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-orange-50 flex items-center gap-1 sm:gap-2">
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="truncate">মোট খরচ (৩০ দিন)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-lg sm:text-xl md:text-2xl font-bold break-all">
                {formatCurrency(totalExpenses)}
              </div>
              <p className="text-[10px] sm:text-xs text-orange-100 mt-0.5 sm:mt-1">
                গত এক মাসের
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Expense Breakdown */}
        {totalExpenses > 0 && (
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-2 mb-4 sm:mb-5">
              <div className="p-1.5 sm:p-2 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex-shrink-0">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                খরচের বিশ্লেষণ
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-2 border-blue-200 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300">
                <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-semibold text-blue-700 flex items-center gap-1.5 sm:gap-2">
                    <div className="p-1 sm:p-1.5 bg-blue-500 rounded-lg flex-shrink-0">
                      <svg
                        className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                    <span className="truncate">শ্রমিক খরচ</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-700 break-all">
                    {formatCurrency(laborTotal)}
                  </div>
                  <div className="text-[10px] sm:text-xs text-blue-600 mt-0.5 sm:mt-1 font-medium">
                    {totalExpenses > 0
                      ? ((laborTotal / totalExpenses) * 100).toFixed(1)
                      : 0}
                    % মোট খরচের
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-2 border-green-200 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300">
                <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-semibold text-green-700 flex items-center gap-1.5 sm:gap-2">
                    <div className="p-1 sm:p-1.5 bg-green-500 rounded-lg flex-shrink-0">
                      <svg
                        className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                    </div>
                    <span className="truncate">মালামাল খরচ</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="text-2xl sm:text-3xl font-bold text-green-700 break-all">
                    {formatCurrency(materialsTotal)}
                  </div>
                  <div className="text-[10px] sm:text-xs text-green-600 mt-0.5 sm:mt-1 font-medium">
                    {totalExpenses > 0
                      ? ((materialsTotal / totalExpenses) * 100).toFixed(1)
                      : 0}
                    % মোট খরচের
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-2 border-orange-200 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300">
                <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-semibold text-orange-700 flex items-center gap-1.5 sm:gap-2">
                    <div className="p-1 sm:p-1.5 bg-orange-500 rounded-lg flex-shrink-0">
                      <svg
                        className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                        />
                      </svg>
                    </div>
                    <span className="truncate">সাইট খরচ</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="text-2xl sm:text-3xl font-bold text-orange-700 break-all">
                    {formatCurrency(activitiesTotal)}
                  </div>
                  <div className="text-[10px] sm:text-xs text-orange-600 mt-0.5 sm:mt-1 font-medium">
                    {totalExpenses > 0
                      ? ((activitiesTotal / totalExpenses) * 100).toFixed(1)
                      : 0}
                    % মোট খরচের
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <DashboardCharts expenseData={expenseData} />
            </div>
          </div>
        )}

        {/* Tenders List */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-slate-200 px-3 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md flex-shrink-0">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <CardTitle className="text-base sm:text-lg md:text-xl font-bold text-gray-900 truncate">
                আপনার টেন্ডার সমূহ
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6">
            {tenders.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <div className="text-gray-400 mb-4">
                  <svg
                    className="w-16 h-16 sm:w-20 sm:h-20 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">
                  কোনো টেন্ডার পাওয়া যায়নি
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  নতুন টেন্ডার যুক্ত করুন
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {tenders.map((tender: any) => (
                  <Link
                    key={tender.id}
                    href={`/tender/${tender.id}`}
                    className="group relative bg-gradient-to-br from-white to-slate-50/50 border-2 border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 hover:border-blue-400 hover:shadow-2xl hover:scale-105 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm sm:text-base text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1">
                          {tender.project_name}
                        </h3>
                        <p className="text-[10px] sm:text-xs font-mono text-gray-500 bg-gray-100 inline-block px-2 py-0.5 sm:py-1 rounded truncate max-w-full">
                          {tender.tender_code}
                        </p>
                      </div>
                    </div>

                    {tender.location && (
                      <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-600 mb-2 sm:mb-3">
                        <svg
                          className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span className="truncate">{tender.location}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full ${
                          tender.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {tender.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}
                      </span>
                      <div className="text-blue-600 group-hover:translate-x-1 transition-transform flex-shrink-0">
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
