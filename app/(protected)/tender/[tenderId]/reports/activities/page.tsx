"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { labels } from "@/lib/utils/bangla";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { exportActivitiesReport } from "@/lib/utils/excel";
import { FileSpreadsheet, Printer, ChevronLeft } from "lucide-react";

export default function ActivitiesRegisterPage({
  params,
}: {
  params: { tenderId: string };
}) {
  const [tender, setTender] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const supabase = createClient();

    const { data: tenderData } = await supabase
      .from("tenders")
      .select("*")
      .eq("id", params.tenderId)
      .single();
    setTender(tenderData);

    const { data: activitiesData } = await supabase
      .from("activity_expenses")
      .select(
        `
        *,
        activity_categories!activity_expenses_category_id_fkey(name_bn),
        subcategory:activity_categories!activity_expenses_subcategory_id_fkey(name_bn)
      `
      )
      .eq("tender_id", params.tenderId)
      .order("expense_date", { ascending: false })
      .limit(200);
    setActivities(activitiesData || []);

    setLoading(false);
  };

  const total =
    activities?.reduce((sum, a) => sum + Number(a.amount || 0), 0) || 0;

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    exportActivitiesReport(activities, tender);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-4 sm:py-6 md:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="mb-4 sm:mb-6 no-print space-y-3">
          <Link
            href={`/tender/${params.tenderId}/reports`}
            className="flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            রিপোর্ট মেনু
          </Link>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
              {labels.activityRegister}
            </h1>
            <div className="flex gap-2">
              <Button
                onClick={handleExport}
                className="bg-green-600 hover:bg-green-700 gap-2 text-xs sm:text-sm h-8 sm:h-9"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </Button>
              <Button
                onClick={handlePrint}
                className="bg-blue-600 hover:bg-blue-700 gap-2 text-xs sm:text-sm h-8 sm:h-9"
              >
                <Printer className="w-4 h-4" />
                Print
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <p className="text-center">{labels.loading}</p>
        ) : (
          <div className="print-content">
            <div className="bg-white border-2 border-gray-300 rounded-lg p-6 mb-6 text-center">
              <h1 className="text-2xl font-bold mb-2">ঠিকাদারি হিসাব</h1>
              <h2 className="text-xl font-semibold mb-4">
                {labels.activityRegister}
              </h2>
              <div className="text-sm space-y-1">
                <p>
                  <strong>টেন্ডার কোড:</strong> {tender?.tender_code}
                </p>
                <p>
                  <strong>প্রকল্পের নাম:</strong> {tender?.project_name}
                </p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>খাজনা খরচ সমূহ</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">তারিখ</th>
                      <th className="text-left py-2">বিষয়</th>
                      <th className="text-left py-2">বিবরণ</th>
                      <th className="text-right py-2">পরিমাণ</th>
                      <th className="text-left py-2">বিক্রেতা</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities?.map((a) => (
                      <tr key={a.id} className="border-b">
                        <td className="py-2">{formatDate(a.expense_date)}</td>
                        <td className="py-2">
                          {a.activity_categories?.name_bn}
                          {a.subcategory && ` - ${a.subcategory.name_bn}`}
                        </td>
                        <td className="py-2">{a.description}</td>
                        <td className="text-right py-2 font-semibold">
                          {formatCurrency(a.amount)}
                        </td>
                        <td className="py-2">{a.vendor || "-"}</td>
                      </tr>
                    ))}
                    <tr className="font-bold border-t-2">
                      <td colSpan={3} className="text-right py-2">
                        মোট:
                      </td>
                      <td className="text-right py-2">
                        {formatCurrency(total)}
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-content {
            padding: 20px;
          }
          @page {
            size: A4 portrait;
            margin: 1.5cm;
          }
        }
      `}</style>
    </div>
  );
}
