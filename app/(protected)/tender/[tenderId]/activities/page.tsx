import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { labels } from "@/lib/utils/bangla";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import EntryActions from "@/components/EntryActions";
import {
  ArrowLeft,
  Plus,
  Wallet,
  TrendingUp,
  FileText,
  Calendar,
  Tag,
  User,
  Receipt,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ActivitiesListPage({
  params,
}: {
  params: { tenderId: string };
}) {
  const supabase = createClient();

  const { data: activities } = await supabase
    .from("activity_expenses")
    .select(
      `
      *,
      activity_categories!activity_expenses_category_id_fkey (name),
      activity_subcategories:activity_categories!activity_expenses_subcategory_id_fkey (name)
    `
    )
    .eq("tender_id", params.tenderId)
    .order("expense_date", { ascending: false })
    .limit(50);

  const total =
    activities?.reduce((sum, a) => sum + Number(a.amount || 0), 0) || 0;

  const byCategory = activities?.reduce((acc: any, a) => {
    const catName = a.activity_categories?.name || "Other";
    if (!acc[catName]) acc[catName] = 0;
    acc[catName] += Number(a.amount || 0);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/30 to-yellow-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <Link
            href={`/tender/${params.tenderId}`}
            className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-amber-700 hover:text-amber-900 transition-colors mb-3 sm:mb-4"
          >
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            Back to tender dashboard
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 sm:p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl sm:rounded-2xl shadow-lg flex-shrink-0">
                <Receipt className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
                  {labels.activityRegister}
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
                  সাইটের দৈনিক খরচ ও কাস্টম খরচ এন্ট্রি
                </p>
              </div>
            </div>

            <Link
              href={`/tender/${params.tenderId}/activities/add`}
              className="w-full sm:w-auto"
            >
              <Button className="w-full sm:w-auto gap-1.5 sm:gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all text-xs sm:text-sm h-9 sm:h-10 md:h-11">
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Add Expense Entry
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          <Card className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
            <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-amber-100 flex items-center gap-1.5 sm:gap-2">
                <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">Total Expenses</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold break-all">
                {formatCurrency(total)}
              </div>
              <p className="text-[10px] sm:text-xs text-amber-100 mt-0.5 sm:mt-1">
                All time
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
            <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-orange-100 flex items-center gap-1.5 sm:gap-2">
                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">Total Entries</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold">
                {activities?.length || 0}
              </div>
              <p className="text-[10px] sm:text-xs text-orange-100 mt-0.5 sm:mt-1">
                Expense records
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Category Breakdown */}
        {byCategory && Object.keys(byCategory).length > 0 && (
          <Card className="mb-6 sm:mb-8 border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 border-b border-amber-100 px-3 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-gray-900">
                <Tag className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                Category Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {Object.entries(byCategory).map(([cat, amt]: [string, any]) => (
                  <div
                    key={cat}
                    className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-3 sm:p-4 hover:shadow-lg hover:scale-105 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                          {cat}
                        </p>
                        <p className="text-lg sm:text-xl md:text-2xl font-bold text-amber-700 mt-1 break-all">
                          {formatCurrency(amt)}
                        </p>
                      </div>
                      <div className="p-1.5 sm:p-2 bg-amber-200 rounded-lg flex-shrink-0">
                        <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-700" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Expense Entries List */}
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 border-b border-amber-100 px-3 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-gray-900">
              <Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
              Recent Expense Entries
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            {!activities || activities.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center">
                  <Receipt className="w-8 h-8 sm:w-10 sm:h-10 text-amber-600" />
                </div>
                <p className="text-gray-600 font-medium mb-4">
                  No expense entries yet
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Start tracking your site expenses
                </p>
                <Link href={`/tender/${params.tenderId}/activities/add`}>
                  <Button className="gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700">
                    <Plus className="h-4 w-4" />
                    Add First Expense
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {activities.map((activity, index) => (
                  <div
                    key={activity.id}
                    className="group bg-gradient-to-br from-white to-amber-50/30 border-2 border-amber-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 hover:border-amber-300 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                      {/* Left Content */}
                      <div className="flex-1 min-w-0">
                        {/* Category Tags */}
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                          <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm">
                            <Tag className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            {activity.activity_categories?.name || "Other"}
                          </span>
                          {activity.activity_subcategories?.name && (
                            <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-amber-100 text-amber-800">
                              {activity.activity_subcategories.name}
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        <h3 className="font-bold text-base sm:text-lg md:text-xl text-gray-900 mb-2 sm:mb-3 line-clamp-2">
                          {activity.description}
                        </h3>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-600 flex-shrink-0" />
                            <span>{formatDate(activity.expense_date)}</span>
                          </div>

                          {activity.quantity && activity.unit && (
                            <div className="flex items-center gap-1.5">
                              <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-600 flex-shrink-0" />
                              <span>
                                {activity.quantity} {activity.unit}
                                {activity.rate &&
                                  ` @ ${formatCurrency(activity.rate)}`}
                              </span>
                            </div>
                          )}

                          {activity.vendor && (
                            <div className="flex items-center gap-1.5">
                              <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-600 flex-shrink-0" />
                              <span className="truncate">
                                {activity.vendor}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Notes */}
                        {activity.notes && (
                          <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-amber-100">
                            <p className="text-xs sm:text-sm text-gray-600 italic line-clamp-2">
                              {activity.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Right Content - Amount & Actions */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 sm:gap-4">
                        <div className="sm:text-right">
                          <p className="text-xs sm:text-sm text-gray-600 mb-0.5 sm:mb-1">
                            Amount
                          </p>
                          <p className="text-xl sm:text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">
                            {formatCurrency(activity.amount)}
                          </p>
                        </div>
                        <EntryActions
                          entryId={activity.id}
                          tableName="activity_expenses"
                          editUrl={`/tender/${params.tenderId}/activities/edit/${activity.id}`}
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
