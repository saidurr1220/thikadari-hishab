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
  Wallet,
  TrendingUp,
  MapPin,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              ড্যাশবোর্ড এ ফিরে যান
            </Link>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2 flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                  {tender.project_name}
                </h1>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs sm:text-sm font-semibold text-blue-700">
                    {tender.tender_code}
                  </span>
                  {tender.location && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs sm:text-sm font-semibold text-green-700">
                      <MapPin className="h-3 w-3" />
                      {tender.location}
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs sm:text-sm font-semibold ${
                      tender.is_active
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {tender.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link href={`/tender/${params.tenderId}/reports`}>
                  <Button variant="outline" className="gap-2 shadow-sm">
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">রিপোর্ট</span>
                  </Button>
                </Link>
                <Link href={`/tender/${params.tenderId}/settings`}>
                  <Button className="gap-2 shadow-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">সেটিংস</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Stats Cards */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              খরচের সারসংক্ষেপ
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0 shadow-lg hover:shadow-xl transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-indigo-100">
                  মোট খরচ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl sm:text-2xl font-bold">
                  {formatCurrency(grandTotal)}
                </p>
                <p className="text-xs text-indigo-100 mt-1">সর্বমোট</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-blue-200 shadow-md hover:shadow-lg transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-blue-700">শ্রমিক</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">
                  {formatCurrency(laborTotal)}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {grandTotal > 0
                    ? `${((laborTotal / grandTotal) * 100).toFixed(1)}%`
                    : "0%"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-green-200 shadow-md hover:shadow-lg transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-green-700">
                  মালামাল
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  {formatCurrency(materialsTotal)}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {grandTotal > 0
                    ? `${((materialsTotal / grandTotal) * 100).toFixed(1)}%`
                    : "0%"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-orange-200 shadow-md hover:shadow-lg transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-orange-700">
                  কাজের খরচ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl sm:text-2xl font-bold text-orange-600">
                  {formatCurrency(activitiesTotal)}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {grandTotal > 0
                    ? `${((activitiesTotal / grandTotal) * 100).toFixed(1)}%`
                    : "0%"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-purple-200 shadow-md hover:shadow-lg transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-purple-700">
                  বিক্রেতা
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl sm:text-2xl font-bold text-purple-600">
                  {formatCurrency(vendorTotal)}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {grandTotal > 0
                    ? `${((vendorTotal / grandTotal) * 100).toFixed(1)}%`
                    : "0%"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-md hover:shadow-lg transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-slate-700">
                  অন্যান্য
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl sm:text-2xl font-bold text-slate-600">
                  {formatCurrency(otherTotal)}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {grandTotal > 0
                    ? `${((otherTotal / grandTotal) * 100).toFixed(1)}%`
                    : "0%"}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
            দ্রুত এন্ট্রি
          </h2>
          <Card className="bg-white border-slate-200 shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <Link
                  href={`/tender/${params.tenderId}/labor/add`}
                  className="group"
                >
                  <Button
                    variant="outline"
                    className="w-full h-auto flex-col gap-2 py-4 hover:border-blue-400 hover:bg-blue-50 transition-all"
                  >
                    <HardHat className="h-6 w-6 text-blue-600 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-medium">শ্রমিক যোগ করুন</span>
                  </Button>
                </Link>

                <Link
                  href={`/tender/${params.tenderId}/materials/add`}
                  className="group"
                >
                  <Button
                    variant="outline"
                    className="w-full h-auto flex-col gap-2 py-4 hover:border-green-400 hover:bg-green-50 transition-all"
                  >
                    <Package className="h-6 w-6 text-green-600 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-medium">
                      মালামাল যোগ করুন
                    </span>
                  </Button>
                </Link>

                <Link
                  href={`/tender/${params.tenderId}/activities/add`}
                  className="group"
                >
                  <Button
                    variant="outline"
                    className="w-full h-auto flex-col gap-2 py-4 hover:border-orange-400 hover:bg-orange-50 transition-all"
                  >
                    <ClipboardList className="h-6 w-6 text-orange-600 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-medium">কাজ যোগ করুন</span>
                  </Button>
                </Link>

                <Link
                  href={`/tender/${params.tenderId}/advances/people`}
                  className="group"
                >
                  <Button
                    variant="outline"
                    className="w-full h-auto flex-col gap-2 py-4 hover:border-purple-400 hover:bg-purple-50 transition-all"
                  >
                    <Users className="h-6 w-6 text-purple-600 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-medium">অগ্রিম</span>
                  </Button>
                </Link>

                <Link
                  href={`/tender/${params.tenderId}/expenses/vendors`}
                  className="group"
                >
                  <Button
                    variant="outline"
                    className="w-full h-auto flex-col gap-2 py-4 hover:border-pink-400 hover:bg-pink-50 transition-all"
                  >
                    <Truck className="h-6 w-6 text-pink-600 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-medium">বিক্রেতা</span>
                  </Button>
                </Link>

                <Link
                  href={`/tender/${params.tenderId}/ledger-summary`}
                  className="group"
                >
                  <Button
                    variant="outline"
                    className="w-full h-auto flex-col gap-2 py-4 hover:border-slate-400 hover:bg-slate-50 transition-all"
                  >
                    <FileText className="h-6 w-6 text-slate-600 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-medium">লেজার</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Main Navigation Cards */}
        <section>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
            রেজিস্টার সমূহ
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href={`/tender/${params.tenderId}/labor`}>
              <Card className="group h-full bg-white border-2 border-slate-200 hover:border-blue-400 shadow-md hover:shadow-xl transition-all cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
                      <HardHat className="h-6 w-6 text-blue-600" />
                    </div>
                    <span className="text-gray-900 group-hover:text-blue-600 transition-colors">
                      শ্রমিক রেজিস্টার
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    দৈনিক শ্রমিক, মজুরি এবং খোরাকি ট্র্যাকিং
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href={`/tender/${params.tenderId}/materials`}>
              <Card className="group h-full bg-white border-2 border-slate-200 hover:border-green-400 shadow-md hover:shadow-xl transition-all cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100 group-hover:bg-green-200 transition-colors">
                      <Package className="h-6 w-6 text-green-600" />
                    </div>
                    <span className="text-gray-900 group-hover:text-green-600 transition-colors">
                      মালামাল রেজিস্টার
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    ক্রয় লগ, সরবরাহকারী এবং পরিমাণ বিশ্লেষণ
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href={`/tender/${params.tenderId}/activities`}>
              <Card className="group h-full bg-white border-2 border-slate-200 hover:border-orange-400 shadow-md hover:shadow-xl transition-all cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-100 group-hover:bg-orange-200 transition-colors">
                      <ClipboardList className="h-6 w-6 text-orange-600" />
                    </div>
                    <span className="text-gray-900 group-hover:text-orange-600 transition-colors">
                      কাজের রেজিস্টার
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    সাইটের কাজ এবং কার্যকলাপ খরচ ট্র্যাক করুন
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href={`/tender/${params.tenderId}/advances/people`}>
              <Card className="group h-full bg-white border-2 border-slate-200 hover:border-purple-400 shadow-md hover:shadow-xl transition-all cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100 group-hover:bg-purple-200 transition-colors">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                    <span className="text-gray-900 group-hover:text-purple-600 transition-colors">
                      স্টাফ অগ্রিম
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    স্টাফ অগ্রিম এবং খরচের বিভক্ত দৃশ্য
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href={`/tender/${params.tenderId}/expenses/vendors`}>
              <Card className="group h-full bg-white border-2 border-slate-200 hover:border-pink-400 shadow-md hover:shadow-xl transition-all cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-pink-100 group-hover:bg-pink-200 transition-colors">
                      <Truck className="h-6 w-6 text-pink-600" />
                    </div>
                    <span className="text-gray-900 group-hover:text-pink-600 transition-colors">
                      বিক্রেতা খরচ
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    বিক্রেতার ক্রয়, পেমেন্ট এবং ব্যালেন্স
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href={`/tender/${params.tenderId}/ledger-summary`}>
              <Card className="group h-full bg-white border-2 border-slate-200 hover:border-slate-400 shadow-md hover:shadow-xl transition-all cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-slate-200 transition-colors">
                      <FileText className="h-6 w-6 text-slate-600" />
                    </div>
                    <span className="text-gray-900 group-hover:text-slate-600 transition-colors">
                      লেজার সারসংক্ষেপ
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    মানুষ এবং বিক্রেতা জুড়ে সম্মিলিত ব্যালেন্স
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
