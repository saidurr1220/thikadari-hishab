"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { labels } from "@/lib/utils/bangla";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { exportMaterialsReport } from "@/lib/utils/excel";
import { FileSpreadsheet, Printer, ChevronLeft } from "lucide-react";

export default function MaterialsRegisterPage({
  params,
}: {
  params: { tenderId: string };
}) {
  const [tender, setTender] = useState<any>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [vendorPurchases, setVendorPurchases] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<string>("all");
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

    const { data: materialsData } = await supabase
      .from("material_purchases")
      .select("*, materials(name_bn), vendors(id, name, phone)")
      .eq("tender_id", params.tenderId)
      .order("purchase_date", { ascending: false })
      .limit(200);
    setMaterials(materialsData || []);

    // Load vendor purchases
    const { data: vendorPurchasesData } = await supabase
      .from("vendor_purchases")
      .select("*, vendors(id, name, phone)")
      .eq("tender_id", params.tenderId)
      .order("purchase_date", { ascending: false })
      .limit(200);
    setVendorPurchases(vendorPurchasesData || []);

    // Load vendors list for filter
    const { data: vendorsData } = await supabase
      .from("vendors")
      .select("id, name, phone")
      .eq("tender_id", params.tenderId)
      .order("name");
    setVendors(vendorsData || []);

    setLoading(false);
  };

  const filteredMaterials = materials.filter(
    (m) => selectedVendor === "all" || m.vendor_id === selectedVendor
  );
  const filteredVendorPurchases = vendorPurchases.filter(
    (v) => selectedVendor === "all" || v.vendor_id === selectedVendor
  );

  const selectedVendorData = vendors.find((v) => v.id === selectedVendor);

  const total =
    (filteredMaterials?.reduce((sum, m) => sum + Number(m.total_amount || 0), 0) || 0) +
    (filteredVendorPurchases?.reduce((sum, v) => sum + Number(v.total_cost || 0), 0) || 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    exportMaterialsReport(materials, tender);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-4 sm:py-6 md:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="mb-4 sm:mb-6 space-y-3 no-print">
          <Link
            href={`/tender/${params.tenderId}/reports`}
            className="flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            রিপোর্ট মেনু
          </Link>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
              {labels.materialsRegister}
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

          {/* Vendor Filter */}
          <div className="flex items-center gap-3">
            <Label htmlFor="vendorFilter" className="font-semibold text-gray-700">
              সরবরাহকারী ফিল্টার:
            </Label>
            <select
              id="vendorFilter"
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="flex-1 sm:flex-none sm:w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">সব দেখুন</option>
              {vendors?.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <p className="text-center">{labels.loading}</p>
        ) : (
          <div className="print-content">
            <div className="bg-white border-2 border-gray-300 rounded-lg p-6 mb-6 text-center">
              <h1 className="text-2xl font-bold mb-2">ঠিকাদারি হিসাব</h1>
              <h2 className="text-xl font-semibold mb-4">
                {labels.materialsRegister}
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
                <CardTitle>মালামাল ক্রয় সমূহ</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">তারিখ</th>
                      <th className="text-left py-2">সরবরাহকারী</th>
                      <th className="text-left py-2">মালামাল</th>
                      <th className="text-right py-2">পরিমাণ</th>
                      <th className="text-right py-2">দর</th>
                      <th className="text-right py-2">মোট</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Regular material purchases */}
                    {filteredMaterials?.map((m) => (
                      <tr key={`mat-${m.id}`} className="border-b hover:bg-gray-50">
                        <td className="py-2">{formatDate(m.purchase_date)}</td>
                        <td className="py-2">{m.vendors?.name || m.supplier || "-"}</td>
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
                      </tr>
                    ))}
                    {/* Vendor purchases */}
                    {filteredVendorPurchases?.map((v) => (
                      <tr
                        key={`ven-${v.id}`}
                        className="border-b bg-blue-50/30 hover:bg-blue-100/50"
                      >
                        <td className="py-2">{formatDate(v.purchase_date)}</td>
                        <td className="py-2">{v.vendors?.name || "-"}</td>
                        <td className="py-2">
                          {v.item_name || "ভেন্ডর ক্রয়"}
                        </td>
                        <td className="text-right py-2">
                          {v.quantity ? `${v.quantity} ${v.unit}` : "-"}
                        </td>
                        <td className="text-right py-2">
                          {v.unit_price ? formatCurrency(v.unit_price) : "-"}
                        </td>
                        <td className="text-right py-2 font-semibold">
                          {formatCurrency(v.total_cost)}
                        </td>
                      </tr>
                    ))}
                    <tr className="font-bold border-t-2 bg-gray-100">
                      <td colSpan={5} className="text-right py-3">
                        সর্বমোট:
                      </td>
                      <td className="text-right py-3 text-lg">
                        {formatCurrency(total)}
                      </td>
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
          body {
            overflow: visible !important;
          }
          .no-print {
            display: none !important;
          }
          .print-content {
            padding: 20px;
            page-break-inside: auto;
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
            size: A4 landscape;
            margin: 1.5cm;
          }
        }
      `}</style>
    </div>
  );
}
