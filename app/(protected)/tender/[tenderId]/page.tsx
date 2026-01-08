import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  ArrowLeft,
  Banknote,
  ClipboardList,
  Coins,
  FileText,
  HardHat,
  Package,
  Settings,
  Truck,
  Users,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Wrench,
  Building2,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/format";

export default async function TenderDashboardPage({
  params,
}: {
  params: { tenderId: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: tender } = await supabase
    .from("tenders")
    .select("*")
    .eq("id", params.tenderId)
    .single();

  if (!tender) {
    return <div className="p-8">Tender not found.</div>;
  }

  const { data: laborEntries } = await supabase
    .from("labor_entries")
    .select("khoraki_total, wage_total, entry_date, payment_method")
    .eq("tender_id", params.tenderId);

  const { data: materialPurchases } = await supabase
    .from("material_purchases")
    .select("total_amount, purchase_date")
    .eq("tender_id", params.tenderId);

  const { data: activityExpenses } = await supabase
    .from("activity_expenses")
    .select("amount, expense_date")
    .eq("tender_id", params.tenderId);

  const { data: rollupExpenses } = await supabase
    .from("expense_rollup")
    .select("amount, source_type")
    .eq("tender_id", params.tenderId);

  const laborTotal =
    laborEntries?.reduce(
      (sum, l) =>
        sum + Number(l.khoraki_total || 0) + Number(l.wage_total || 0),
      0
    ) || 0;
  const materialsTotal =
    materialPurchases?.reduce(
      (sum, m) => sum + Number(m.total_amount || 0),
      0
    ) || 0;
  const activitiesTotal =
    activityExpenses?.reduce((sum, a) => sum + Number(a.amount || 0), 0) || 0;
  const rollupTotal =
    rollupExpenses?.reduce((sum, e) => sum + Number(e.amount || 0), 0) || 0;
  const vendorTotal =
    rollupExpenses
      ?.filter((e) => e.source_type === "vendor_purchase")
      .reduce((sum, e) => sum + Number(e.amount || 0), 0) || 0;
  const otherTotal = rollupTotal - vendorTotal;
  const grandTotal =
    laborTotal + materialsTotal + activitiesTotal + rollupTotal;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30">
      <div>
        <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur-sm shadow-sm">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-5 md:py-6">
            <div className="flex flex-col gap-3 sm:gap-4 md:gap-5">
              <div className="space-y-2 sm:space-y-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                  Back to dashboard
                </Link>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 sm:p-2.5 md:p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl shadow-md flex-shrink-0">
                    <Building2 className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 truncate">
                      {tender.project_name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1 sm:mt-2">
                      <span className="rounded-full border border-blue-200 sm:border-2 bg-blue-50 px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm font-semibold text-blue-700">
                        {tender.tender_code}
                      </span>
                      {tender.location ? (
                        <span className="rounded-full border border-amber-200 sm:border-2 bg-amber-50 px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm font-semibold text-amber-700 truncate max-w-[200px] sm:max-w-none">
                          📍 {tender.location}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <Link href={`/tender/${params.tenderId}/reports`}>
                  <Button
                    variant="outline"
                    className="gap-1.5 sm:gap-2 border border-slate-200 sm:border-2 hover:bg-blue-50 hover:border-blue-300 transition-all text-xs sm:text-sm h-8 sm:h-9 md:h-10 px-2.5 sm:px-3 md:px-4"
                  >
                    <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">Reports</span>
                  </Button>
                </Link>
                <Link href={`/tender/${params.tenderId}/settings`}>
                  <Button className="gap-1.5 sm:gap-2 bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all text-xs sm:text-sm h-8 sm:h-9 md:h-10 px-2.5 sm:px-3 md:px-4">
                    <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">Settings</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-5 md:space-y-6">
          <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
            <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0 shadow-md hover:shadow-lg transition-all">
              <CardHeader className="pb-1.5 sm:pb-2 px-2.5 sm:px-4 md:px-6 pt-2.5 sm:pt-4 md:pt-6">
                <CardTitle className="text-[10px] sm:text-xs font-medium text-indigo-100 flex items-center gap-0.5 sm:gap-1">
                  <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 flex-shrink-0" />
                  <span className="truncate">Total</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2.5 sm:px-4 md:px-6 pb-2.5 sm:pb-4 md:pb-6">
                <p className="text-base sm:text-lg md:text-xl font-bold break-all">
                  {formatCurrency(grandTotal)}
                </p>
                <p className="text-[8px] sm:text-[10px] text-indigo-100 mt-0.5">
                  All-time
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-md hover:shadow-lg transition-all">
              <CardHeader className="pb-1.5 sm:pb-2 px-2.5 sm:px-4 md:px-6 pt-2.5 sm:pt-4 md:pt-6">
                <CardTitle className="text-[10px] sm:text-xs font-medium text-blue-100 flex items-center gap-0.5 sm:gap-1">
                  <HardHat className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 flex-shrink-0" />
                  <span className="truncate">Labor</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2.5 sm:px-4 md:px-6 pb-2.5 sm:pb-4 md:pb-6">
                <p className="text-base sm:text-lg md:text-xl font-bold break-all">
                  {formatCurrency(laborTotal)}
                </p>
                <p className="text-[8px] sm:text-[10px] text-blue-100 mt-0.5">
                  {grandTotal > 0
                    ? `${((laborTotal / grandTotal) * 100).toFixed(1)}%`
                    : "0%"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-md hover:shadow-lg transition-all">
              <CardHeader className="pb-1.5 sm:pb-2 px-2.5 sm:px-4 md:px-6 pt-2.5 sm:pt-4 md:pt-6">
                <CardTitle className="text-[10px] sm:text-xs font-medium text-green-100 flex items-center gap-0.5 sm:gap-1">
                  <Package className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 flex-shrink-0" />
                  <span className="truncate">Materials</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2.5 sm:px-4 md:px-6 pb-2.5 sm:pb-4 md:pb-6">
                <p className="text-base sm:text-lg md:text-xl font-bold break-all">
                  {formatCurrency(materialsTotal)}
                </p>
                <p className="text-[8px] sm:text-[10px] text-green-100 mt-0.5">
                  {grandTotal > 0
                    ? `${((materialsTotal / grandTotal) * 100).toFixed(1)}%`
                    : "0%"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0 shadow-md hover:shadow-lg transition-all">
              <CardHeader className="pb-1.5 sm:pb-2 px-2.5 sm:px-4 md:px-6 pt-2.5 sm:pt-4 md:pt-6">
                <CardTitle className="text-[10px] sm:text-xs font-medium text-amber-100 flex items-center gap-0.5 sm:gap-1">
                  <Wrench className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 flex-shrink-0" />
                  <span className="truncate">Site Expenses</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2.5 sm:px-4 md:px-6 pb-2.5 sm:pb-4 md:pb-6">
                <p className="text-base sm:text-lg md:text-xl font-bold break-all">
                  {formatCurrency(activitiesTotal)}
                </p>
                <p className="text-[8px] sm:text-[10px] text-amber-100 mt-0.5">
                  {grandTotal > 0
                    ? `${((activitiesTotal / grandTotal) * 100).toFixed(1)}%`
                    : "0%"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-md hover:shadow-lg transition-all">
              <CardHeader className="pb-1.5 sm:pb-2 px-2.5 sm:px-4 md:px-6 pt-2.5 sm:pt-4 md:pt-6">
                <CardTitle className="text-[10px] sm:text-xs font-medium text-purple-100 flex items-center gap-0.5 sm:gap-1">
                  <ShoppingCart className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 flex-shrink-0" />
                  <span className="truncate">Vendors</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2.5 sm:px-4 md:px-6 pb-2.5 sm:pb-4 md:pb-6">
                <p className="text-base sm:text-lg md:text-xl font-bold break-all">
                  {formatCurrency(vendorTotal)}
                </p>
                <p className="text-[8px] sm:text-[10px] text-purple-100 mt-0.5">
                  {grandTotal > 0
                    ? `${((vendorTotal / grandTotal) * 100).toFixed(1)}%`
                    : "0%"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-500 to-slate-600 text-white border-0 shadow-md hover:shadow-lg transition-all">
              <CardHeader className="pb-1.5 sm:pb-2 px-2.5 sm:px-4 md:px-6 pt-2.5 sm:pt-4 md:pt-6">
                <CardTitle className="text-[10px] sm:text-xs font-medium text-slate-100 flex items-center gap-0.5 sm:gap-1">
                  <DollarSign className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 flex-shrink-0" />
                  <span className="truncate">Other</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2.5 sm:px-4 md:px-6 pb-2.5 sm:pb-4 md:pb-6">
                <p className="text-base sm:text-lg md:text-xl font-bold break-all">
                  {formatCurrency(otherTotal)}
                </p>
                <p className="text-[8px] sm:text-[10px] text-slate-100 mt-0.5">
                  {grandTotal > 0
                    ? `${((otherTotal / grandTotal) * 100).toFixed(1)}%`
                    : "0%"}
                </p>
              </CardContent>
            </Card>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
            <Card className="lg:col-span-2 bg-white border-slate-200 shadow-md">
              <CardHeader className="border-b border-slate-100 pb-2 sm:pb-3 px-3 sm:px-6">
                <CardTitle className="text-sm sm:text-base font-semibold text-slate-900 flex items-center gap-1.5 sm:gap-2">
                  <Coins className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
                  <span className="truncate">Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 sm:pt-4 px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
                  <Link href={`/tender/${params.tenderId}/labor/add`}>
                    <Button
                      variant="outline"
                      className="w-full gap-1 sm:gap-2 h-8 sm:h-9 md:h-10 text-xs sm:text-sm border border-slate-200 sm:border-2 hover:bg-blue-50 hover:border-blue-300 transition-all px-2 sm:px-3"
                    >
                      <HardHat className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
                      <span className="truncate">Labor</span>
                    </Button>
                  </Link>
                  <Link href={`/tender/${params.tenderId}/purchases/add`}>
                    <Button
                      variant="outline"
                      className="w-full gap-1 sm:gap-2 h-8 sm:h-9 md:h-10 text-xs sm:text-sm border border-slate-200 sm:border-2 hover:bg-green-50 hover:border-green-300 transition-all px-2 sm:px-3"
                    >
                      <Package className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                      <span className="truncate">Purchase</span>
                    </Button>
                  </Link>
                  <Link href={`/tender/${params.tenderId}/activities/add`}>
                    <Button
                      variant="outline"
                      className="w-full gap-1 sm:gap-2 h-8 sm:h-9 md:h-10 text-xs sm:text-sm border border-slate-200 sm:border-2 hover:bg-amber-50 hover:border-amber-300 transition-all px-2 sm:px-3"
                    >
                      <ClipboardList className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600 flex-shrink-0" />
                      <span className="truncate">Site Expense</span>
                    </Button>
                  </Link>
                  <Link href={`/tender/${params.tenderId}/advances/people`}>
                    <Button
                      variant="outline"
                      className="w-full gap-1 sm:gap-2 h-8 sm:h-9 md:h-10 text-xs sm:text-sm border border-slate-200 sm:border-2 hover:bg-purple-50 hover:border-purple-300 transition-all px-2 sm:px-3"
                    >
                      <Users className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 flex-shrink-0" />
                      <span className="truncate">Advances</span>
                    </Button>
                  </Link>
                  <Link href={`/tender/${params.tenderId}/purchases`}>
                    <Button
                      variant="outline"
                      className="w-full gap-1 sm:gap-2 h-8 sm:h-9 md:h-10 text-xs sm:text-sm border border-slate-200 sm:border-2 hover:bg-indigo-50 hover:border-indigo-300 transition-all px-2 sm:px-3"
                    >
                      <Truck className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-600 flex-shrink-0" />
                      <span className="truncate">Purchases</span>
                    </Button>
                  </Link>
                  <Link href={`/tender/${params.tenderId}/expenses/overview`}>
                    <Button
                      variant="outline"
                      className="w-full gap-1 sm:gap-2 h-8 sm:h-9 md:h-10 text-xs sm:text-sm border border-slate-200 sm:border-2 hover:bg-slate-50 hover:border-slate-300 transition-all px-2 sm:px-3"
                    >
                      <Coins className="h-3 w-3 sm:h-4 sm:w-4 text-slate-600 flex-shrink-0" />
                      <span className="truncate">Overview</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-md">
              <CardHeader className="border-b border-slate-100 pb-2 sm:pb-3 px-3 sm:px-6">
                <CardTitle className="text-sm sm:text-base font-semibold text-slate-900 flex items-center gap-1.5 sm:gap-2">
                  <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                  <span className="truncate">Balance Reports</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 sm:pt-4 px-3 sm:px-6 pb-3 sm:pb-6 space-y-1.5 sm:space-y-2">
                <Link href={`/tender/${params.tenderId}/advances/people`}>
                  <Button
                    variant="outline"
                    className="w-full gap-1 sm:gap-2 h-8 sm:h-9 md:h-10 text-xs sm:text-sm border border-slate-200 sm:border-2 hover:bg-purple-50 hover:border-purple-300 transition-all px-2 sm:px-3"
                  >
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 flex-shrink-0" />
                    <span className="truncate">Staff Balances</span>
                  </Button>
                </Link>
                <Link href={`/tender/${params.tenderId}/purchases`}>
                  <Button
                    variant="outline"
                    className="w-full gap-1 sm:gap-2 h-8 sm:h-9 md:h-10 text-xs sm:text-sm border border-slate-200 sm:border-2 hover:bg-indigo-50 hover:border-indigo-300 transition-all px-2 sm:px-3"
                  >
                    <Truck className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-600 flex-shrink-0" />
                    <span className="truncate">Vendor Balances</span>
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
            <Link href={`/tender/${params.tenderId}/labor`}>
              <Card className="group cursor-pointer bg-white border-slate-200 shadow-md transition-all hover:-translate-y-1 hover:shadow-lg hover:border-blue-300">
                <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
                  <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                    <div className="p-1 sm:p-1.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors flex-shrink-0">
                      <HardHat className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                    </div>
                    <span className="truncate">Labor Register</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <p className="text-[10px] sm:text-xs text-slate-600 leading-relaxed">
                    Daily crews, wages, and food allowance.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href={`/tender/${params.tenderId}/purchases`}>
              <Card className="group cursor-pointer bg-white border-slate-200 shadow-md transition-all hover:-translate-y-1 hover:shadow-lg hover:border-green-300">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm text-slate-900 group-hover:text-green-600 transition-colors">
                    <div className="p-1.5 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                      <Package className="h-4 w-4 text-green-600" />
                    </div>
                    Purchases & Vendors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Purchase management with vendor profiles.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href={`/tender/${params.tenderId}/activities`}>
              <Card className="group cursor-pointer bg-white border-slate-200 shadow-md transition-all hover:-translate-y-1 hover:shadow-lg hover:border-amber-300">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm text-slate-900 group-hover:text-amber-600 transition-colors">
                    <div className="p-1.5 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors">
                      <ClipboardList className="h-4 w-4 text-amber-600" />
                    </div>
                    Activity Register
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Operational work and activity costs.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href={`/tender/${params.tenderId}/advances/people`}>
              <Card className="group cursor-pointer bg-white border-slate-200 shadow-md transition-all hover:-translate-y-1 hover:shadow-lg hover:border-purple-300">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm text-slate-900 group-hover:text-purple-600 transition-colors">
                    <div className="p-1.5 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                      <Users className="h-4 w-4 text-purple-600" />
                    </div>
                    Staff Advances
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Staff advances and expenses.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href={`/tender/${params.tenderId}/expenses/overview`}>
              <Card className="group cursor-pointer bg-white border-slate-200 shadow-md transition-all hover:-translate-y-1 hover:shadow-lg hover:border-slate-300">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm text-slate-900 group-hover:text-slate-600 transition-colors">
                    <div className="p-1.5 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
                      <FileText className="h-4 w-4 text-slate-600" />
                    </div>
                    Expense Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Overview of all project expenses.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </section>
        </main>
      </div>
    </div>
  );
}
