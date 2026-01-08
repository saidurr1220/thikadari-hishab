import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import {
  ArrowLeft,
  TrendingDown,
  Receipt,
  Filter,
  Calendar,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ExpensesOverviewPage({
  params,
}: {
  params: { tenderId: string };
}) {
  const supabase = createClient();

  const { data: expenses } = await supabase
    .from("expense_rollup")
    .select("*")
    .eq("tender_id", params.tenderId)
    .order("entry_date", { ascending: false });

  // Fetch MFS transactions for linking
  const { data: vendorPayments } = await supabase
    .from("vendor_payments")
    .select("id, payment_date, amount, vendor_id, vendors(name)")
    .eq("tender_id", params.tenderId)
    .eq("payment_method", "mfs");

  const { data: personAdvances } = await supabase
    .from("person_advances")
    .select(`
      id, 
      advance_date, 
      amount, 
      person_id, 
      user_id, 
      person:persons!person_advances_person_id_fkey (full_name), 
      user:profiles!person_advances_user_id_fkey (full_name)
    `)
    .eq("tender_id", params.tenderId)
    .eq("payment_method", "mfs");

  const total =
    expenses?.reduce((sum, e: any) => sum + Number(e.amount || 0), 0) || 0;

  // Group by source type
  const expensesByType = expenses?.reduce((acc: any, e: any) => {
    if (!acc[e.source_type]) {
      acc[e.source_type] = { total: 0, count: 0 };
    }
    acc[e.source_type].total += Number(e.amount || 0);
    acc[e.source_type].count += 1;
    return acc;
  }, {});

  // Group MFS charges by date with their transactions
  const mfsChargesByDate = expenses
    ?.filter((e: any) => e.source_type === "mfs_charge")
    .reduce((acc: any, charge: any) => {
      const dateKey = charge.entry_date;
      if (!acc[dateKey]) {
        acc[dateKey] = {
          charges: [],
          totalCharge: 0,
        };
      }
      
      // Find the source transaction - match by date and ID
      let sourceTransaction = null;
      let sourceType = "unknown";
      let sourceName = "Unknown";

      // Debug: detect what type of IDs we have
      const cVendorId = charge.vendor_id;
      const cPersonId = charge.person_id;

      if (cVendorId) {
        // This is a vendor payment
        const vendorPayment = vendorPayments?.find(
          (vp: any) => String(vp.vendor_id) === String(cVendorId)
        );
        if (vendorPayment) {
          sourceTransaction = vendorPayment;
          sourceType = "vendor";
          sourceName = (vendorPayment.vendors as any)?.name || "Vendor Payment";
        }
      } else if (cPersonId) {
        // This is a person advance
        const personAdvance = personAdvances?.find(
          (pa: any) => 
            String(pa.person_id) === String(cPersonId) || 
            String(pa.user_id) === String(cPersonId)
        );
        if (personAdvance) {
          sourceTransaction = personAdvance;
          sourceType = "person";
          sourceName = (personAdvance.person as any)?.full_name || 
                      (personAdvance.user as any)?.full_name || 
                      "Staff/Person";
        }
      }

      acc[dateKey].charges.push({
        ...charge,
        sourceTransaction,
        sourceType: sourceType === "unknown" && (cPersonId || charge.person_id) ? "person" : (sourceType === "unknown" && (cVendorId || charge.vendor_id) ? "vendor" : sourceType),
        sourceName: (sourceName === "Unknown" || !sourceName) ? (cVendorId ? "Vendor Payment" : (cPersonId ? "Staff/Person Advance" : "bKash Entry")) : sourceName,
      });
      acc[dateKey].totalCharge += Number(charge.amount || 0);
      return acc;
    }, {}) || {};

  const getSourceTypeLabel = (type: string) => {
    const labels: any = {
      vendor_purchase: "Vendor Purchases",
      material_purchase: "Material Purchases",
      labor_entry: "Labor Entries",
      activity_expense: "Site Expenses",
      mfs_charge: "bKash Charges",
    };
    return labels[type] || type;
  };

  const getSourceTypeColor = (type: string) => {
    const colors: any = {
      vendor_purchase: "bg-purple-50 border-purple-200 text-purple-700",
      material_purchase: "bg-green-50 border-green-200 text-green-700",
      labor_entry: "bg-blue-50 border-blue-200 text-blue-700",
      activity_expense: "bg-amber-50 border-amber-200 text-amber-700",
      mfs_charge: "bg-orange-50 border-orange-200 text-orange-700",
    };
    return colors[type] || "bg-gray-50 border-gray-200 text-gray-700";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link
            href={`/tender/${params.tenderId}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to tender dashboard
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center justify-center md:justify-start gap-3">
                <Receipt className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                All Expenses Overview
              </h1>
              <p className="text-sm text-gray-600 mt-2">
                Complete expense breakdown across all categories
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-100 flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Total Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(total)}</div>
              <p className="text-xs text-blue-100 mt-1">
                {expenses?.length || 0} total entries
              </p>
            </CardContent>
          </Card>

          {expensesByType &&
            Object.entries(expensesByType)
              .slice(0, 3)
              .map(([type, data]: [string, any]) => (
                <Card
                  key={type}
                  className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-all"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      {getSourceTypeLabel(type)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(data.total)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {data.count} entries
                    </p>
                  </CardContent>
                </Card>
              ))}
        </div>

        {/* Expenses List */}
        <Card className="shadow-md border-slate-200">
          <CardHeader className="border-b border-slate-100 bg-white">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-gray-900">
                Expense Details
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                {expenses?.length || 0} entries
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {!expenses || expenses.length === 0 ? (
              <div className="text-center py-16">
                <Receipt className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">
                  No expenses yet
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Start adding expenses to see them here
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {(() => {
                  // Group expenses by date and merge MFS charges
                  const grouped: any = {};
                  const processedMfsDates = new Set();

                  expenses.forEach((e: any, idx: number) => {
                    const dateKey = e.entry_date;
                    
                    if (e.source_type === "mfs_charge") {
                      if (!processedMfsDates.has(dateKey)) {
                        processedMfsDates.add(dateKey);
                        if (!grouped[dateKey]) grouped[dateKey] = [];
                        grouped[dateKey].push({
                          type: "mfs_group",
                          date: dateKey,
                          data: mfsChargesByDate[dateKey],
                          idx,
                        });
                      }
                    } else {
                      if (!grouped[dateKey]) grouped[dateKey] = [];
                      grouped[dateKey].push({ type: "expense", data: e, idx });
                    }
                  });

                  return Object.values(grouped)
                    .flat()
                    .map((item: any) => {
                      if (item.type === "mfs_group") {
                        return (
                          <details
                            key={`mfs-${item.date}`}
                            className="p-4 sm:p-5 hover:bg-slate-50 transition-colors group"
                            suppressHydrationWarning
                          >
                            <summary className="cursor-pointer list-none">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-3">
                                    <p className="font-semibold text-gray-900">
                                      {formatDate(item.date)}
                                    </p>
                                    <span className="text-xs px-2 py-1 rounded-full border bg-orange-50 border-orange-200 text-orange-700">
                                      bKash Charges ({item.data.charges.length})
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    Click to view {item.data.charges.length} transaction{item.data.charges.length > 1 ? "s" : ""}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <p className="text-2xl font-bold text-orange-600">
                                    {formatCurrency(item.data.totalCharge)}
                                  </p>
                                </div>
                              </div>
                            </summary>
                            <div className="mt-4 ml-4 space-y-3 border-l-2 border-orange-200 pl-4">
                              {item.data.charges.map((charge: any, cidx: number) => (
                                <div
                                  key={cidx}
                                  className="bg-orange-50/50 rounded-lg p-3 border border-orange-100"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                      <p className="font-medium text-gray-800">
                                        {charge.sourceName || `Unknown (${charge.person_id || charge.vendor_id || 'No ID'})`}
                                      </p>
                                      <p className="text-sm text-gray-600 mt-1">
                                        Payment: {formatCurrency(charge.sourceTransaction?.amount || 0)}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        {charge.sourceType === "vendor" ? "Vendor Payment" : "Person Advance"}
                                      </p>
                                    </div>
                                    <p className="font-semibold text-orange-600">
                                      {formatCurrency(charge.amount)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </details>
                        );
                      } else {
                        const e = item.data;
                        return (
                          <div
                            key={`${e.source_type}-${item.idx}`}
                            className="p-4 sm:p-5 hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-3">
                                  <p className="font-semibold text-gray-900">
                                    {formatDate(e.entry_date)}
                                  </p>
                                  <span
                                    className={`text-xs px-2 py-1 rounded-full border ${getSourceTypeColor(
                                      e.source_type
                                    )}`}
                                  >
                                    {getSourceTypeLabel(e.source_type)}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600">
                                  {e.description || "No description"}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <p className="text-2xl font-bold text-red-600">
                                  {formatCurrency(e.amount)}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    });
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
