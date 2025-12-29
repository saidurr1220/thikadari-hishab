"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { labels } from "@/lib/utils/bangla";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { exportDailyReport } from "@/lib/utils/excel";
import {
  FileSpreadsheet,
  Printer,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function DailySheetPage({
  params,
}: {
  params: { tenderId: string };
}) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    labor: [],
    materials: [],
    activities: [],
    advances: [],
  });
  const [tender, setTender] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [date]);

  const loadData = async () => {
    setLoading(true);
    const supabase = createClient();

    // Load tender info
    const { data: tenderData } = await supabase
      .from("tenders")
      .select("*")
      .eq("id", params.tenderId)
      .single();
    setTender(tenderData);

    // Load labor entries
    const { data: labor } = await supabase
      .from("labor_entries")
      .select("*, work_types(name_bn)")
      .eq("tender_id", params.tenderId)
      .eq("entry_date", date);

    // Load materials
    const { data: materials } = await supabase
      .from("material_purchases")
      .select("*, materials(name_bn)")
      .eq("tender_id", params.tenderId)
      .eq("purchase_date", date);

    // Load activities
    const { data: activities } = await supabase
      .from("activity_expenses")
      .select("*, expense_categories(name_bn)")
      .eq("tender_id", params.tenderId)
      .eq("expense_date", date);

    // Load advances
    const { data: advances } = await supabase
      .from("advances")
      .select("*, users(full_name)")
      .eq("tender_id", params.tenderId)
      .eq("advance_date", date);

    setData({
      labor: labor || [],
      materials: materials || [],
      activities: activities || [],
      advances: advances || [],
    });
    setLoading(false);
  };

  const laborTotal =
    data.labor.reduce(
      (sum: number, l: any) =>
        sum + Number(l.khoraki_total || 0) + Number(l.wage_total || 0),
      0
    ) || 0;
  const materialsTotal =
    data.materials.reduce(
      (sum: number, m: any) => sum + Number(m.total_amount || 0),
      0
    ) || 0;
  const activitiesTotal =
    data.activities.reduce(
      (sum: number, a: any) => sum + Number(a.amount || 0),
      0
    ) || 0;
  const advancesTotal =
    data.advances.reduce(
      (sum: number, a: any) => sum + Number(a.amount || 0),
      0
    ) || 0;
  const grandTotal =
    laborTotal + materialsTotal + activitiesTotal + advancesTotal;

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    exportDailyReport(data, tender, date);
  };

  const changeDate = (days: number) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    setDate(newDate.toISOString().split("T")[0]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-4 sm:py-6 md:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="mb-4 sm:mb-6 no-print">
          <Link
            href={`/tender/${params.tenderId}/reports`}
            className="flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            রিপোর্ট মেনু
          </Link>
        </div>

        {/* Controls */}
        <Card className="mb-6 no-print shadow-lg border-t-4 border-t-blue-500">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <Label
                  htmlFor="date"
                  className="text-sm font-semibold text-gray-700"
                >
                  তারিখ নির্বাচন করুন
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button
                onClick={() => changeDate(-1)}
                variant="outline"
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                আগের দিন
              </Button>
              <Button
                onClick={() => changeDate(1)}
                variant="outline"
                className="gap-2"
              >
                পরের দিন
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                onClick={handleExport}
                className="bg-green-600 hover:bg-green-700 gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Excel Export
              </Button>
              <Button
                onClick={handlePrint}
                className="bg-blue-600 hover:bg-blue-700 gap-2"
              >
                <Printer className="w-4 h-4" />
                {labels.print}
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <p className="text-center">{labels.loading}</p>
        ) : (
          <div className="print-content">
            {/* Report Header */}
            <div className="bg-white border-2 border-gray-300 rounded-lg p-6 mb-6 text-center">
              <h1 className="text-2xl font-bold mb-2">ঠিকাদারি হিসাব</h1>
              <h2 className="text-xl font-semibold mb-4">
                {labels.dailySheet}
              </h2>
              <div className="text-sm space-y-1">
                <p>
                  <strong>টেন্ডার কোড:</strong>{" "}
                  {tender?.tender_code}
                </p>
                <p>
                  <strong>প্রকল্পের নাম:</strong>{" "}
                  {tender?.project_name}
                </p>
                {tender?.location && (
                  <p>
                    <strong>স্থান:</strong> {tender.location}
                  </p>
                )}
                <p>
                  <strong>তারিখ:</strong> {formatDate(date)}
                </p>
              </div>
            </div>

            {/* Labor Section */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>শ্রমিক খরচ</CardTitle>
              </CardHeader>
              <CardContent>
                {data.labor.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    কোন এন্ট্রি নেই
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">ধরন</th>
                        <th className="text-left py-2">বিবরণ</th>
                        <th className="text-right py-2">লোক</th>
                        <th className="text-right py-2">খোরাকি</th>
                        <th className="text-right py-2">মজুরি</th>
                        <th className="text-right py-2">মোট</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.labor.map((l: any) => (
                        <tr key={l.id} className="border-b">
                          <td className="py-2">
                            {l.labor_type === "contract"
                              ? "ঠেকতি"
                              : "দৈনিক"}
                          </td>
                          <td className="py-2">
                            {l.crew_name || l.labor_name || "-"}
                            {l.work_types && ` - ${l.work_types.name_bn}`}
                          </td>
                          <td className="text-right py-2">
                            {l.headcount || "-"}
                          </td>
                          <td className="text-right py-2">
                            {l.khoraki_total
                              ? formatCurrency(l.khoraki_total)
                              : "-"}
                          </td>
                          <td className="text-right py-2">
                            {l.wage_total ? formatCurrency(l.wage_total) : "-"}
                          </td>
                          <td className="text-right py-2 font-semibold">
                            {formatCurrency(
                              (l.khoraki_total || 0) + (l.wage_total || 0)
                            )}
                          </td>
                        </tr>
                      ))}
                      <tr className="font-bold">
                        <td colSpan={5} className="text-right py-2">
                          উপমোট:
                        </td>
                        <td className="text-right py-2">
                          {formatCurrency(laborTotal)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>

            {/* Materials Section */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>মালামাল ক্রয়</CardTitle>
              </CardHeader>
              <CardContent>
                {data.materials.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    কোন এন্ট্রি নেই
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">মালামাল</th>
                        <th className="text-right py-2">পরিমাণ</th>
                        <th className="text-right py-2">দর</th>
                        <th className="text-right py-2">মোট</th>
                        <th className="text-left py-2">সরবরাহকারী</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.materials.map((m: any) => (
                        <tr key={m.id} className="border-b">
                          <td className="py-2">
                            {m.materials?.name_bn || m.custom_item_name}
                            {m.is_bulk_breakdown && " *"}
                          </td>
                          <td className="text-right py-2">
                            {m.quantity} {m.unit}
                          </td>
                          <td className="text-right py-2">
                            {formatCurrency(m.unit_rate)}
                          </td>
                          <td className="text-right py-2 font-semibold">
                            {formatCurrency(m.total_amount)}
                          </td>
                          <td className="py-2">{m.supplier || "-"}</td>
                        </tr>
                      ))}
                      <tr className="font-bold">
                        <td colSpan={3} className="text-right py-2">
                          উপমোট:
                        </td>
                        <td className="text-right py-2">
                          {formatCurrency(materialsTotal)}
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>

            {/* Activities Section */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>কাজের খরচ</CardTitle>
              </CardHeader>
              <CardContent>
                {data.activities.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    কোন এন্ট্রি নেই
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">বিভাগ</th>
                        <th className="text-left py-2">বিবরণ</th>
                        <th className="text-right py-2">পরিমাণ</th>
                        <th className="text-left py-2">
                          বিক্রেতা
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.activities.map((a: any) => (
                        <tr key={a.id} className="border-b">
                          <td className="py-2">
                            {a.expense_categories?.name_bn}
                          </td>
                          <td className="py-2">{a.description}</td>
                          <td className="text-right py-2 font-semibold">
                            {formatCurrency(a.amount)}
                          </td>
                          <td className="py-2">{a.vendor || "-"}</td>
                        </tr>
                      ))}
                      <tr className="font-bold">
                        <td colSpan={2} className="text-right py-2">
                          উপমোট:
                        </td>
                        <td className="text-right py-2">
                          {formatCurrency(activitiesTotal)}
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>

            {/* Advances Section */}
            {data.advances.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>অগ্রিম প্রদান</CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">ব্যক্তি</th>
                        <th className="text-left py-2">
                          উদ্দেশ্য
                        </th>
                        <th className="text-right py-2">পরিমাণ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.advances.map((a: any) => (
                        <tr key={a.id} className="border-b">
                          <td className="py-2">{a.users?.full_name}</td>
                          <td className="py-2">{a.purpose}</td>
                          <td className="text-right py-2 font-semibold">
                            {formatCurrency(a.amount)}
                          </td>
                        </tr>
                      ))}
                      <tr className="font-bold">
                        <td colSpan={2} className="text-right py-2">
                          উপমোট:
                        </td>
                        <td className="text-right py-2">
                          {formatCurrency(advancesTotal)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>
                  দিনের সারসংক্ষেপ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b">
                    <span>শ্রমিক খরচ:</span>
                    <span className="font-semibold">
                      {formatCurrency(laborTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span>মালামাল:</span>
                    <span className="font-semibold">
                      {formatCurrency(materialsTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span>কাজের খরচ:</span>
                    <span className="font-semibold">
                      {formatCurrency(activitiesTotal)}
                    </span>
                  </div>
                  {advancesTotal > 0 && (
                    <div className="flex justify-between py-2 border-b">
                      <span>অগ্রিম:</span>
                      <span className="font-semibold">
                        {formatCurrency(advancesTotal)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between py-3 text-lg font-bold border-t-2">
                    <span>মোট:</span>
                    <span>{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="mt-8 pt-8 border-t-2 grid grid-cols-3 gap-8 text-center text-sm">
              <div>
                <p className="mb-8">à¦ªà§à¦°à¦¸à§à¦¤à§à¦¤à¦•à¦¾à¦°à§€</p>
                <p className="border-t pt-2">
                  à¦¸à§à¦¬à¦¾à¦•à§à¦·à¦° à¦“ তারিখ
                </p>
              </div>
              <div>
                <p className="mb-8">à¦ªà¦°à§€à¦•à§à¦·à¦•</p>
                <p className="border-t pt-2">
                  à¦¸à§à¦¬à¦¾à¦•à§à¦·à¦° à¦“ তারিখ
                </p>
              </div>
              <div>
                <p className="mb-8">à¦…à¦¨à§à¦®à§‹à¦¦à¦¨à¦•à¦¾à¦°à§€</p>
                <p className="border-t pt-2">
                  à¦¸à§à¦¬à¦¾à¦•à§à¦·à¦° à¦“ তারিখ
                </p>
              </div>
            </div>
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
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
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
