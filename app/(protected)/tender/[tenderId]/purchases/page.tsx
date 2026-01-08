"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  TrendingUp,
  Users,
  ShoppingCart,
  AlertCircle,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils/format";

interface Vendor {
  id: string;
  name: string;
  phone: string | null;
  category_id: string | null;
  total_purchases: number;
  total_paid: number;
  due_amount: number;
  last_purchase_date: string | null;
  purchase_count: number;
}

interface Purchase {
  id: string;
  date: string;
  vendor_name: string;
  vendor_id: string | null;
  item_name: string;
  quantity: number;
  unit: string;
  amount: number;
  type: "material" | "vendor";
  payment_status: "paid" | "due" | "partial";
}

export default function PurchasesPage({
  params,
}: {
  params: { tenderId: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"purchases" | "vendors">(
    "purchases"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "material" | "vendor">(
    "all"
  );

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [stats, setStats] = useState({
    totalPurchases: 0,
    totalPaid: 0,
    totalDue: 0,
    activeVendors: 0,
  });

  useEffect(() => {
    if (params.tenderId) {
      loadData();
    }
  }, [params.tenderId]);

  const loadData = async () => {
    setLoading(true);
    const supabase = createClient();

    // Load vendors with aggregated data
    const { data: vendorData, error: vendorError } = await supabase
      .from("vendors")
      .select("*")
      .eq("tender_id", params.tenderId);

    if (vendorError) console.error("Vendor error:", vendorError);

    // Load vendor purchases
    const { data: vendorPurchases, error: vpError } = await supabase
      .from("vendor_purchases")
      .select(
        `
        *,
        vendor:vendors(id, name, phone)
      `
      )
      .eq("tender_id", params.tenderId)
      .order("purchase_date", { ascending: false });

    if (vpError) console.error("VP error:", vpError);

    // Load material purchases
    const { data: materialPurchases, error: mpError } = await supabase
      .from("material_purchases")
      .select(
        `
        *,
        material:materials(name_bn)
      `
      )
      .eq("tender_id", params.tenderId)
      .order("purchase_date", { ascending: false });

    if (mpError) console.error("MP error:", mpError);

    // Load vendor payments
    const { data: payments, error: payError } = await supabase
      .from("vendor_payments")
      .select("*")
      .eq("tender_id", params.tenderId);

    if (payError) console.error("Payment error:", payError);

    // Process vendors
    const vendorMap = new Map<string, Vendor>();
    vendorData?.forEach((v) => {
      vendorMap.set(v.id, {
        id: v.id,
        name: v.name,
        phone: v.phone,
        category_id: v.category_id,
        total_purchases: 0,
        total_paid: 0,
        due_amount: 0,
        last_purchase_date: null,
        purchase_count: 0,
      });
    });

    // Aggregate vendor purchases and create vendors from purchase data if not exists
    vendorPurchases?.forEach((vp: any) => {
      if (!vendorMap.has(vp.vendor_id) && vp.vendor) {
        // Create vendor from purchase data if not in vendors table
        vendorMap.set(vp.vendor_id, {
          id: vp.vendor_id,
          name: vp.vendor.name || "Unknown Vendor",
          phone: vp.vendor.phone,
          category_id: null,
          total_purchases: 0,
          total_paid: 0,
          due_amount: 0,
          last_purchase_date: null,
          purchase_count: 0,
        });
      }

      const vendor = vendorMap.get(vp.vendor_id);
      if (vendor) {
        const amount = Number(vp.total_cost || 0);
        vendor.total_purchases += amount;
        vendor.purchase_count += 1;
        if (
          !vendor.last_purchase_date ||
          vp.purchase_date > vendor.last_purchase_date
        ) {
          vendor.last_purchase_date = vp.purchase_date;
        }
      }
    });

    // Aggregate material purchases
    // Note: material_purchases table needs vendor_id column migration
    materialPurchases?.forEach((mp) => {
      if (mp.vendor_id) {
        // Create vendor from material purchase if not exists
        if (!vendorMap.has(mp.vendor_id)) {
          // Get vendor info from vendors table or vendorData
          const vendorInfo = vendorData?.find((v) => v.id === mp.vendor_id);
          if (vendorInfo) {
            vendorMap.set(mp.vendor_id, {
              id: vendorInfo.id,
              name: vendorInfo.name,
              phone: vendorInfo.phone,
              category_id: vendorInfo.category_id,
              total_purchases: 0,
              total_paid: 0,
              due_amount: 0,
              last_purchase_date: null,
              purchase_count: 0,
            });
          }
        }

        const vendor = vendorMap.get(mp.vendor_id);
        if (vendor) {
          const amount = Number(mp.total_amount || 0);
          vendor.total_purchases += amount;
          vendor.purchase_count += 1;
          if (
            !vendor.last_purchase_date ||
            mp.purchase_date > vendor.last_purchase_date
          ) {
            vendor.last_purchase_date = mp.purchase_date;
          }
        }
      }
    });

    // Aggregate payments
    payments?.forEach((p) => {
      const vendor = vendorMap.get(p.vendor_id);
      if (vendor) {
        const amount = Number(p.amount || 0);
        vendor.total_paid += amount;
      }
    });

    // Calculate due amounts
    vendorMap.forEach((vendor) => {
      vendor.due_amount = vendor.total_purchases - vendor.total_paid;
    });

    // Process purchases for unified list
    const allPurchases: Purchase[] = [];

    vendorPurchases?.forEach((vp: any) => {
      // Calculate payment status based on vendor's overall balance
      const vendor = vendorMap.get(vp.vendor_id);
      let paymentStatus: "paid" | "due" | "partial" = "due";

      if (vendor) {
        const balance = vendor.due_amount;
        if (balance <= 0) {
          paymentStatus = "paid"; // Vendor has no due or overpaid
        } else if (vendor.total_paid > 0) {
          paymentStatus = "partial"; // Some payment made but still has balance
        }
      }

      allPurchases.push({
        id: vp.id,
        date: vp.purchase_date,
        vendor_name: vp.vendor?.name || "Unknown Vendor",
        vendor_id: vp.vendor_id,
        item_name: vp.item_name || "Vendor Purchase",
        quantity: Number(vp.quantity || 0),
        unit: vp.unit || "",
        amount: Number(vp.total_cost || 0),
        type: "vendor",
        payment_status: paymentStatus,
      });
    });

    materialPurchases?.forEach((mp) => {
      const vendor = mp.vendor_id
        ? vendorData?.find((v) => v.id === mp.vendor_id)
        : null;

      // Calculate payment status
      let paymentStatus: "paid" | "due" | "partial" = "due";

      if (mp.vendor_id) {
        const vendorInfo = vendorMap.get(mp.vendor_id);
        if (vendorInfo) {
          const balance = vendorInfo.due_amount;
          if (balance <= 0) {
            paymentStatus = "paid"; // Vendor has no due or overpaid
          } else if (vendorInfo.total_paid > 0) {
            paymentStatus = "partial"; // Some payment made but still has balance
          }
        }
      } else {
        // No vendor = direct purchase, check payment_method
        paymentStatus = mp.payment_method === "cash" ? "paid" : "due";
      }

      allPurchases.push({
        id: mp.id,
        date: mp.purchase_date,
        vendor_name: vendor?.name || mp.supplier || "Direct Purchase",
        vendor_id: mp.vendor_id,
        item_name: mp.material?.name_bn || mp.custom_item_name || "Material",
        quantity: Number(mp.quantity || 0),
        unit: mp.unit || "",
        amount: Number(mp.total_amount || 0),
        type: "material",
        payment_status: paymentStatus,
      });
    });

    // Sort by date
    allPurchases.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Calculate stats
    const totalPurchases = allPurchases.reduce((sum, p) => sum + p.amount, 0);
    const totalDue = Array.from(vendorMap.values()).reduce(
      (sum, v) => sum + v.due_amount,
      0
    );

    const vendorList = Array.from(vendorMap.values());

    setVendors(vendorList);
    setPurchases(allPurchases);
    setStats({
      totalPurchases,
      totalPaid: totalPurchases - totalDue,
      totalDue,
      activeVendors: vendorMap.size,
    });
    setLoading(false);
  };

  const filteredPurchases = purchases.filter((p) => {
    const matchesSearch =
      p.vendor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.item_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === "all" || p.type === filterType;

    return matchesSearch && matchesType;
  });

  const filteredVendors = vendors.filter((v) =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading purchases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <Link
            href={`/tender/${params.tenderId}`}
            className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 mb-3 sm:mb-4"
          >
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            Back to dashboard
          </Link>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="w-full sm:w-auto">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1 sm:mb-2">
                Purchases & Vendors
              </h1>
              <p className="text-xs sm:text-sm text-slate-600">
                Unified purchase management and vendor tracking
              </p>
            </div>

            <Button
              onClick={() =>
                router.push(`/tender/${params.tenderId}/purchases/add`)
              }
              className="gap-1.5 sm:gap-2 bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm h-8 sm:h-9 md:h-10 w-full sm:w-auto px-3 sm:px-4"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Add Purchase</span>
              <span className="xs:hidden">Add</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
              <CardTitle className="text-[10px] sm:text-xs md:text-sm font-medium opacity-90 flex items-center gap-1 sm:gap-2">
                <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">Total Purchases</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="text-base sm:text-xl md:text-2xl font-bold break-all">
                {formatCurrency(stats.totalPurchases)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
              <CardTitle className="text-[10px] sm:text-xs md:text-sm font-medium opacity-90 flex items-center gap-1 sm:gap-2">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">Total Paid</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="text-base sm:text-xl md:text-2xl font-bold break-all">
                {formatCurrency(stats.totalPaid)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
              <CardTitle className="text-[10px] sm:text-xs md:text-sm font-medium opacity-90 flex items-center gap-1 sm:gap-2">
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">Total Due</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="text-base sm:text-xl md:text-2xl font-bold break-all">
                {formatCurrency(stats.totalDue)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
              <CardTitle className="text-[10px] sm:text-xs md:text-sm font-medium opacity-90 flex items-center gap-1 sm:gap-2">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">Active Vendors</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="text-base sm:text-xl md:text-2xl font-bold">
                {stats.activeVendors}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 border-b border-slate-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab("purchases")}
            className={`px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === "purchases"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <span className="hidden sm:inline">
              All Purchases ({purchases.length})
            </span>
            <span className="sm:hidden">Purchases ({purchases.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("vendors")}
            className={`px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === "vendors"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <span className="hidden sm:inline">
              Vendor Profiles ({vendors.length})
            </span>
            <span className="sm:hidden">Vendors ({vendors.length})</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === "purchases"
                  ? "Search purchases by vendor or item..."
                  : "Search vendors by name..."
              }
              className="pl-10"
            />
          </div>

          {activeTab === "purchases" && (
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                onClick={() => setFilterType("all")}
                size="sm"
                className="text-xs h-8"
              >
                All
              </Button>
              <Button
                variant={filterType === "material" ? "default" : "outline"}
                onClick={() => setFilterType("material")}
                size="sm"
                className="text-xs h-8"
              >
                <span className="hidden xs:inline">Materials</span>
                <span className="xs:hidden">Mat</span>
              </Button>
              <Button
                variant={filterType === "vendor" ? "default" : "outline"}
                onClick={() => setFilterType("vendor")}
                size="sm"
                className="text-xs h-8"
              >
                <span className="hidden xs:inline">Vendor Items</span>
                <span className="xs:hidden">Vendor</span>
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        {activeTab === "purchases" ? (
          <Card>
            <CardContent className="p-0">
              {/* Desktop Table View - Hidden on Mobile */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Vendor
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {filteredPurchases.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-8 text-center text-slate-500"
                        >
                          No purchases found
                        </td>
                      </tr>
                    ) : (
                      filteredPurchases.map((purchase) => (
                        <tr
                          key={purchase.id}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm text-slate-900">
                            {formatDate(purchase.date)}
                          </td>
                          <td className="px-4 py-3">
                            {purchase.vendor_id ? (
                              <Link
                                href={`/tender/${params.tenderId}/purchases/vendor/${purchase.vendor_id}`}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                              >
                                {purchase.vendor_name}
                              </Link>
                            ) : (
                              <span className="text-sm text-slate-600">
                                {purchase.vendor_name}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-900">
                            {purchase.item_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {purchase.quantity} {purchase.unit}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">
                            {formatCurrency(purchase.amount)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                purchase.type === "material"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-purple-100 text-purple-800"
                              }`}
                            >
                              {purchase.type === "material"
                                ? "Material"
                                : "Vendor"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                purchase.payment_status === "paid"
                                  ? "bg-green-100 text-green-800"
                                  : purchase.payment_status === "partial"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {purchase.payment_status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              {purchase.vendor_id ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    router.push(
                                      `/tender/${params.tenderId}/purchases/vendor/${purchase.vendor_id}`
                                    )
                                  }
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              ) : (
                                <span className="text-xs text-slate-400 px-2">
                                  Direct
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Mobile Card View - Visible on Mobile Only */}
              <div className="md:hidden divide-y divide-slate-200">
                {filteredPurchases.length === 0 ? (
                  <div className="px-4 py-8 text-center text-slate-500">
                    No purchases found
                  </div>
                ) : (
                  filteredPurchases.map((purchase) => (
                    <div key={purchase.id} className="p-4 hover:bg-slate-50">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-slate-900 truncate">
                            {purchase.item_name}
                          </div>
                          {purchase.vendor_id ? (
                            <Link
                              href={`/tender/${params.tenderId}/purchases/vendor/${purchase.vendor_id}`}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium truncate block"
                            >
                              {purchase.vendor_name}
                            </Link>
                          ) : (
                            <span className="text-xs text-slate-600 truncate block">
                              {purchase.vendor_name}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1 ml-2">
                          <span
                            className={`inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full whitespace-nowrap ${
                              purchase.type === "material"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {purchase.type === "material" ? "Mat" : "Ven"}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-500">Date: </span>
                          <span className="text-slate-900">{formatDate(purchase.date)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-500">Qty: </span>
                          <span className="text-slate-900">{purchase.quantity} {purchase.unit}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                        <div className="text-base font-bold text-slate-900">
                          {formatCurrency(purchase.amount)}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full ${
                              purchase.payment_status === "paid"
                                ? "bg-green-100 text-green-800"
                                : purchase.payment_status === "partial"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {purchase.payment_status}
                          </span>
                          {purchase.vendor_id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                router.push(
                                  `/tender/${params.tenderId}/purchases/vendor/${purchase.vendor_id}`
                                )
                              }
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-6 w-6 p-0"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVendors.length === 0 ? (
              <div className="col-span-full text-center py-12 text-slate-500">
                No vendors found
              </div>
            ) : (
              filteredVendors.map((vendor) => (
                <Card
                  key={vendor.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() =>
                    router.push(
                      `/tender/${params.tenderId}/purchases/vendor/${vendor.id}`
                    )
                  }
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {vendor.name}
                        </CardTitle>
                        {vendor.phone && (
                          <p className="text-sm text-slate-500 mt-1">
                            {vendor.phone}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(
                            `/tender/${params.tenderId}/purchases/vendor/${vendor.id}`
                          );
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">
                        Total Purchases:
                      </span>
                      <span className="text-sm font-semibold text-slate-900">
                        {formatCurrency(vendor.total_purchases)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Paid:</span>
                      <span className="text-sm font-semibold text-green-600">
                        {formatCurrency(vendor.total_paid)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                      <span className="text-sm font-medium text-slate-700">
                        Due:
                      </span>
                      <span
                        className={`text-sm font-bold ${
                          vendor.due_amount > 0
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {formatCurrency(vendor.due_amount)}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-200">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>{vendor.purchase_count} purchases</span>
                        {vendor.last_purchase_date && (
                          <span>
                            Last: {formatDate(vendor.last_purchase_date)}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
