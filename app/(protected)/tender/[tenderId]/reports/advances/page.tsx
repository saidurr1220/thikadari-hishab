"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { labels } from "@/lib/utils/bangla";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { exportAdvancesReport } from "@/lib/utils/excel";
import { FileSpreadsheet, Printer, ChevronLeft } from "lucide-react";

export default function AdvancesRegisterPage({
  params,
}: {
  params: { tenderId: string };
}) {
  const [tender, setTender] = useState<any>(null);
  const [balances, setBalances] = useState<any[]>([]);
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

    const { data: balancesData, error: balancesError } = await supabase.rpc("get_person_balances", {
      p_tender_id: params.tenderId,
    });
    
    if (balancesError) {
      console.error("Error loading balances:", balancesError);
    }
    setBalances(balancesData || []);

    setLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    exportAdvancesReport(balances, tender);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6 flex items-center justify-between no-print">
          <Link
            href={`/tender/${params.tenderId}/reports`}
            className="flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            রিপোর্ট মেনু
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">{labels.advanceLedger}</h1>
          <div className="flex gap-2">
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
              Print
            </Button>
          </div>
        </div>

        {loading ? (
          <p className="text-center">{labels.loading}</p>
        ) : balances && balances.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <p>কোনো অগ্রিম তথ্য পাওয়া যায়নি।</p>
              <p className="text-sm mt-2">প্রথমে কিছু ব্যক্তিকে অগ্রিম প্রদান করুন।</p>
            </CardContent>
          </Card>
        ) : (
          <div className="print-content">
          <div className="bg-white border-2 border-gray-300 rounded-lg p-6 mb-6 text-center">
            <h1 className="text-2xl font-bold mb-2">ঠিকাদারি হিসাব</h1>
            <h2 className="text-xl font-semibold mb-4">
              {labels.advanceLedger}
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
              <CardTitle>ব্যক্তিভিত্তিক হিসাব</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">ব্যক্তি</th>
                    <th className="text-left py-2">ভূমিকা</th>
                    <th className="text-right py-2">মোট অগ্রিম</th>
                    <th className="text-right py-2">মোট খরচ</th>
                    <th className="text-right py-2">ব্যালেন্স</th>
                  </tr>
                </thead>
                <tbody>
                  {balances?.map((bal: any) => (
                    <tr key={bal.person_id} className="border-b">
                      <td className="py-2">{bal.person_name}</td>
                      <td className="py-2">{bal.role}</td>
                      <td className="text-right py-2">
                        {formatCurrency(bal.total_advances)}
                      </td>
                      <td className="text-right py-2">
                        {formatCurrency(bal.total_expenses)}
                      </td>
                      <td
                        className={`text-right py-2 font-semibold ${
                          bal.balance > 0
                            ? "text-green-600"
                            : bal.balance < 0
                            ? "text-red-600"
                            : ""
                        }`}
                      >
                        {formatCurrency(Math.abs(bal.balance))}
                        {bal.balance > 0
                          ? " (বাকি)"
                          : bal.balance < 0
                          ? " (পাওনা)"
                          : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
          </div>
        )}
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          
          .no-print {
            display: none !important;
          }
          
          .print-content {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          
          @page {
            size: A4 portrait;
            margin: 15mm 12mm;
          }
          
          /* Avoid breaks inside tables */
          table {
            page-break-inside: avoid;
          }
          
          /* Print colors */
          .text-green-600 {
            color: #15803d !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .text-red-600 {
            color: #b91c1c !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          /* Font sizes */
          body {
            font-size: 11pt;
            line-height: 1.4;
          }
          
          h1 {
            font-size: 18pt;
          }
          
          h2 {
            font-size: 14pt;
          }
        }
      `}</style>
    </div>
  );
}
