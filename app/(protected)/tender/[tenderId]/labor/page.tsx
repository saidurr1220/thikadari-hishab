import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { labels } from "@/lib/utils/bangla";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import EntryActions from "@/components/EntryActions";
import {
  ArrowLeft,
  Users,
  Briefcase,
  TrendingUp,
  Calendar,
  UserPlus,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LaborListPage({
  params,
  searchParams,
}: {
  params: { tenderId: string };
  searchParams?: { tab?: string };
}) {
  const supabase = createClient();

  const { data: laborEntries } = await supabase
    .from("labor_entries")
    .select(
      `
      *,
      work_types (name_bn),
      subcontractors (name)
    `
    )
    .eq("tender_id", params.tenderId)
    .order("entry_date", { ascending: false })
    .limit(50);

  const calcBase = (entry: any) =>
    Number(entry.khoraki_total || 0) + Number(entry.wage_total || 0);

  const dailyEntries = (laborEntries || []).filter(
    (l) => l.labor_type === "daily"
  );
  const contractEntries = (laborEntries || []).filter(
    (l) => l.labor_type === "contract"
  );

  const dailyTotal =
    dailyEntries?.reduce((sum, l) => sum + calcBase(l), 0) || 0;
  const contractTotal =
    contractEntries?.reduce((sum, l) => sum + calcBase(l), 0) || 0;
  const combinedTotal = dailyTotal + contractTotal;

  const activeTab = searchParams?.tab === "daily" ? "daily" : "contract";
  const activeEntries =
    activeTab === "contract" ? contractEntries : dailyEntries;
  const activeTotal = activeTab === "contract" ? contractTotal : dailyTotal;

  const tabClass = (tab: "daily" | "contract") =>
    [
      "flex-1 rounded-lg border px-4 py-3 text-center text-sm font-semibold transition-all",
      activeTab === tab
        ? "border-blue-500 bg-blue-500 text-white shadow-lg scale-105"
        : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:shadow-md",
    ].join(" ");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-5 md:space-y-6">
        {/* Header */}
        <header className="space-y-3 sm:space-y-4">
          <Link
            href={`/tender/${params.tenderId}`}
            className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            Back to tender dashboard
          </Link>

          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-2.5 md:p-3 bg-blue-100 rounded-lg sm:rounded-xl flex-shrink-0">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">
                    Labor & Subcontractors
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
                    Manage site workforce and track daily & contract labor
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Link href={`/tender/${params.tenderId}/labor/add`}>
                <Button className="shadow-md hover:shadow-lg transition-all gap-1.5 sm:gap-2 bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm h-8 sm:h-9 md:h-10 px-2.5 sm:px-3 md:px-4">
                  <UserPlus className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Add Labor Entry</span>
                  <span className="xs:hidden">Add</span>
                </Button>
              </Link>
              <Link
                href={`/tender/${params.tenderId}/labor/subcontractors/add`}
              >
                <Button
                  variant="outline"
                  className="shadow-sm hover:shadow-md transition-all gap-2"
                >
                  <Briefcase className="h-4 w-4" />
                  Add Subcontractor
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-100 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Daily Labor (Expense)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatCurrency(dailyTotal)}
              </div>
              <p className="text-sm text-blue-100 mt-2">
                {dailyEntries.length} entries
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-100 flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Contract Labor (Khoraki)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatCurrency(contractTotal)}
              </div>
              <p className="text-sm text-purple-100 mt-2">
                {contractEntries.length} entries
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0 shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-amber-100 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Total Combined
                </CardTitle>
                <Link
                  href={`/tender/${params.tenderId}/labor/subcontractors`}
                  className="text-xs text-amber-100 hover:text-white underline underline-offset-2"
                >
                  By Subcontractor →
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatCurrency(combinedTotal)}
              </div>
              <p className="text-sm text-amber-100 mt-2">All labor expenses</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 sm:gap-4">
          <Link
            href={`/tender/${params.tenderId}/labor?tab=daily`}
            className={tabClass("daily")}
          >
            <Users className="h-4 w-4 inline-block mr-2" />
            Daily Labor
          </Link>
          <Link
            href={`/tender/${params.tenderId}/labor?tab=contract`}
            className={tabClass("contract")}
          >
            <Briefcase className="h-4 w-4 inline-block mr-2" />
            Contract Labor
          </Link>
        </div>

        {/* Entries List */}
        <Card className="border-slate-200 shadow-md">
          <CardHeader className="border-b border-slate-100 bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-xl font-semibold">
                  {activeTab === "contract"
                    ? "Contract Labor Khoraki Entries"
                    : "Daily Labor Expense Entries"}
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  {activeEntries.length} entries · {formatCurrency(activeTotal)}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                Latest entries shown first
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {activeEntries.length === 0 ? (
              <div className="text-center py-16">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium mb-2">
                  {activeTab === "contract"
                    ? "No contract labor entries yet"
                    : "No daily labor entries yet"}
                </p>
                <p className="text-gray-400 text-sm mb-6">
                  Start tracking your {activeTab} labor expenses
                </p>
                <Link
                  href={`/tender/${params.tenderId}/labor/add?laborType=${activeTab}`}
                >
                  <Button className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Add Your First Entry
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {activeEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-4 sm:p-5 hover:bg-slate-50 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-700">
                            {formatDate(entry.entry_date)}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              entry.labor_type === "contract"
                                ? "bg-purple-100 text-purple-700 border border-purple-200"
                                : "bg-blue-100 text-blue-700 border border-blue-200"
                            }`}
                          >
                            {entry.labor_type === "contract"
                              ? "Contract"
                              : "Daily"}
                          </span>
                          {entry.subcontractors?.name && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200">
                              <Briefcase className="h-3 w-3 inline mr-1" />
                              {entry.subcontractors.name}
                            </span>
                          )}
                        </div>
                        <div className="text-base font-semibold text-gray-900">
                          {entry.crew_name ||
                            entry.labor_name ||
                            "Unnamed crew"}
                        </div>
                        {entry.work_types?.name_bn && (
                          <div className="text-sm text-gray-600">
                            {entry.work_types.name_bn}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">
                            {formatCurrency(calcBase(entry))}
                          </div>
                        </div>
                        <EntryActions
                          entryId={entry.id}
                          tableName="labor_entries"
                          editUrl={`/tender/${params.tenderId}/labor/edit/${entry.id}`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
