"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  CreditCard,
  Phone,
  Calendar,
  Plus,
  DollarSign,
  Edit,
  Trash2,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/utils/format";

interface Transaction {
  id: string;
  date: string;
  type: "purchase" | "payment";
  item_name?: string;
  quantity?: number;
  unit?: string;
  amount: number;
  payment_method?: string;
  notes?: string;
  source?: "vendor_purchase" | "material_purchase" | "payment";
}

export default function VendorDetailPage({
  params,
}: {
  params: { tenderId: string; vendorId: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState<any>(null);
  const [tender, setTender] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({
    totalPurchases: 0,
    totalPaid: 0,
    balance: 0,
    purchaseCount: 0,
    paymentCount: 0,
  });

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [vendorEdit, setVendorEdit] = useState({
    name: "",
    phone: "",
    categoryIds: [] as string[],
    notes: "",
  });
  const [updating, setUpdating] = useState(false);
  const [paymentData, setPaymentData] = useState({
    paymentDate: new Date().toISOString().split("T")[0],
    amount: "",
    paymentMethod: "cash",
    reference: "",
    notes: "",
    mfsCharge: false,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("vendor_categories")
      .select("*")
      .eq("is_active", true)
      .order("name");
    if (data) setCategories(data);
  };

  const loadData = async () => {
    setLoading(true);
    const supabase = createClient();

    // Load current user
    const { data: authData } = await supabase.auth.getUser();
    if (authData.user) {
      const { data: userData } = await supabase
        .from("users")
        .select("full_name, email")
        .eq("id", authData.user.id)
        .single();
      setCurrentUser(userData);
    }

    // Load tender details
    const { data: tenderData } = await supabase
      .from("tenders")
      .select("*")
      .eq("id", params.tenderId)
      .single();
    
    setTender(tenderData);

    // Load vendor details
    const { data: vendorData } = await supabase
      .from("vendors")
      .select("*, vendor_categories(name, name_bn)")
      .eq("id", params.vendorId)
      .single();

    // Load vendor category mappings
    const { data: mappingsData } = await supabase
      .from("vendor_category_mappings")
      .select("category_id")
      .eq("vendor_id", params.vendorId);

    if (vendorData) {
      vendorData.categoryIds = mappingsData?.map((m) => m.category_id) || [];
    }

    // Load vendor purchases
    const { data: vendorPurchases } = await supabase
      .from("vendor_purchases")
      .select("*")
      .eq("vendor_id", params.vendorId)
      .order("purchase_date", { ascending: false });

    // Load material purchases
    const { data: materialPurchases } = await supabase
      .from("material_purchases")
      .select("*, material:materials(name_bn)")
      .eq("vendor_id", params.vendorId)
      .order("purchase_date", { ascending: false });

    // Load payments
    const { data: payments } = await supabase
      .from("vendor_payments")
      .select("*")
      .eq("vendor_id", params.vendorId)
      .order("payment_date", { ascending: false });

    // Combine transactions
    const allTransactions: Transaction[] = [];

    vendorPurchases?.forEach((vp) => {
      allTransactions.push({
        id: vp.id,
        date: vp.purchase_date,
        type: "purchase",
        item_name: vp.item_name,
        quantity: vp.quantity,
        unit: vp.unit,
        amount: Number(vp.total_amount || 0),
        notes: vp.notes,
        payment_method: vp.payment_method,
        source: "vendor_purchase",
      });
    });

    materialPurchases?.forEach((mp) => {
      allTransactions.push({
        id: mp.id,
        date: mp.purchase_date,
        type: "purchase",
        item_name: mp.material?.name_bn || mp.custom_item_name,
        quantity: mp.quantity,
        unit: mp.unit,
        amount: Number(mp.total_amount || 0),
        payment_method: mp.payment_method,
        notes: mp.notes,
        source: "material_purchase",
      });
    });

    payments?.forEach((p) => {
      // Skip auto-generated payments (to avoid duplicate lines)
      if (p.notes && (p.notes.includes('Auto payment for') || p.notes.includes('auto payment'))) {
        return;
      }
      
      allTransactions.push({
        id: p.id,
        date: p.payment_date,
        type: "payment",
        amount: Number(p.amount || 0),
        payment_method: p.payment_method,
        notes: p.notes,
        source: "payment",
      });
    });

    // Sort by date
    allTransactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Calculate stats
    const totalPurchases =
      (vendorPurchases?.reduce(
        (sum, p) => sum + Number(p.total_amount || 0),
        0
      ) || 0) +
      (materialPurchases?.reduce(
        (sum, p) => sum + Number(p.total_amount || 0),
        0
      ) || 0);

    const totalPaid =
      payments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;

    setVendor(vendorData);
    setTransactions(allTransactions);
    setStats({
      totalPurchases,
      totalPaid,
      balance: totalPurchases - totalPaid,
      purchaseCount:
        (vendorPurchases?.length || 0) + (materialPurchases?.length || 0),
      paymentCount: payments?.length || 0,
    });
    setLoading(false);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not authenticated");

      // Calculate amount with MFS charge if applicable
      let finalAmount = Number(parseFloat(paymentData.amount).toFixed(2));
      let paymentNotes = paymentData.notes || "";
      
      if (paymentData.paymentMethod === "mfs" && paymentData.mfsCharge) {
        const percentageCharge = finalAmount * 0.0185; // 1.85% charge
        const totalCharge = percentageCharge + 10; // + ৳10 fee
        finalAmount = Number((finalAmount + totalCharge).toFixed(2));
        
        if (paymentNotes) {
          paymentNotes += " (incl. MFS charge)";
        } else {
          paymentNotes = "MFS payment with charge included";
        }
      }

      const { error } = await supabase.from("vendor_payments").insert({
        tender_id: params.tenderId,
        vendor_id: params.vendorId,
        payment_date: paymentData.paymentDate,
        amount: finalAmount,
        payment_method: paymentData.paymentMethod,
        reference: paymentData.reference || null,
        notes: paymentNotes || null,
        recorded_by: auth.user.id,
      });

      if (error) throw error;

      setShowPaymentForm(false);
      setPaymentData({
        paymentDate: new Date().toISOString().split("T")[0],
        amount: "",
        paymentMethod: "cash",
        reference: "",
        notes: "",
        mfsCharge: false,
      });
      loadData();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (txn: Transaction) => {
    if (!confirm(`Delete this ${txn.type}? This cannot be undone.`)) return;

    try {
      const supabase = createClient();
      let error;

      if (txn.type === "payment") {
        const result = await supabase
          .from("vendor_payments")
          .delete()
          .eq("id", txn.id);
        error = result.error;
      } else {
        // Delete purchase
        if (txn.source === "vendor_purchase") {
          // First, find and delete any auto-generated payment for this specific purchase
          // Try multiple matching strategies to catch all related payments
          const { data: relatedPayments } = await supabase
            .from("vendor_payments")
            .select("id, notes, payment_date, amount")
            .eq("vendor_id", params.vendorId);

          // Filter payments that match this purchase
          const matchingPayments = relatedPayments?.filter(p => {
            // Match by purchase ID in notes
            const notesMatch = p.notes?.toLowerCase().includes(`purchase ${txn.id}`);
            // Match by date and amount (for older payments without proper notes)
            const dateAmountMatch = p.payment_date === txn.date && Math.abs(p.amount - txn.amount) < 0.01;
            return notesMatch || dateAmountMatch;
          }) || [];

          if (matchingPayments.length > 0) {
            await supabase
              .from("vendor_payments")
              .delete()
              .in("id", matchingPayments.map(p => p.id));
          }

          // Then delete the purchase itself
          const result = await supabase
            .from("vendor_purchases")
            .delete()
            .eq("id", txn.id);
          error = result.error;
        } else if (txn.source === "material_purchase") {
          // First, find and delete any auto-generated payment for this specific material purchase
          const { data: relatedPayments } = await supabase
            .from("vendor_payments")
            .select("id, notes, payment_date, amount")
            .eq("vendor_id", params.vendorId);

          // Filter payments that match this purchase
          const matchingPayments = relatedPayments?.filter(p => {
            // Match by purchase ID in notes
            const notesMatch = p.notes?.toLowerCase().includes(`purchase ${txn.id}`);
            // Match by date and amount (for older payments without proper notes)
            const dateAmountMatch = p.payment_date === txn.date && Math.abs(p.amount - txn.amount) < 0.01;
            return notesMatch || dateAmountMatch;
          }) || [];

          if (matchingPayments.length > 0) {
            await supabase
              .from("vendor_payments")
              .delete()
              .in("id", matchingPayments.map(p => p.id));
          }

          // Then delete the material purchase itself
          const result = await supabase
            .from("material_purchases")
            .delete()
            .eq("id", txn.id);
          error = result.error;
        }
      }

      if (error) throw error;

      loadData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleEditTransaction = (txn: Transaction) => {
    // Redirect to appropriate edit page
    if (txn.source === "vendor_purchase") {
      router.push(`/tender/${params.tenderId}/expenses/vendors/${params.vendorId}?edit=${txn.id}`);
    } else if (txn.source === "material_purchase") {
      router.push(`/tender/${params.tenderId}/materials/edit/${txn.id}`);
    }
  };

  const handleEditVendor = () => {
    setVendorEdit({
      name: vendor.name || "",
      phone: vendor.phone || "",
      categoryIds: vendor.categoryIds || [],
      notes: vendor.notes || "",
    });
    setShowEditForm(true);
  };

  const handleUpdateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorEdit.name.trim()) {
      alert("Vendor name is required");
      return;
    }

    setUpdating(true);
    try {
      const supabase = createClient();

      // Update vendor basic info
      const { error: updateError } = await supabase
        .from("vendors")
        .update({
          name: vendorEdit.name,
          phone: vendorEdit.phone || null,
          notes: vendorEdit.notes || null,
        })
        .eq("id", params.vendorId);

      if (updateError) throw updateError;

      // Delete old category mappings
      await supabase
        .from("vendor_category_mappings")
        .delete()
        .eq("vendor_id", params.vendorId);

      // Insert new category mappings
      if (vendorEdit.categoryIds.length > 0) {
        const { error: mappingError } = await supabase
          .from("vendor_category_mappings")
          .insert(
            vendorEdit.categoryIds.map((catId) => ({
              vendor_id: params.vendorId,
              category_id: catId,
            }))
          );

        if (mappingError) throw mappingError;
      }

      setShowEditForm(false);
      loadData();
    } catch (err: any) {
      alert("Error updating vendor: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading vendor details...</p>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Vendor not found</p>
          <Button
            onClick={() => router.push(`/tender/${params.tenderId}/purchases`)}
            className="mt-4"
          >
            Back to Purchases
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Print Header - Only visible in print */}
        <div className="print-header">
          {/* Company Name & Address */}
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '18pt', fontWeight: 'bold', marginBottom: '4px' }}>
              মেসার্স সোনালী ট্রেডার্স
            </div>
            <div style={{ fontSize: '9pt', color: '#333' }}>
              মুরাদনগর, কুমিল্লা।
            </div>
          </div>

          {/* Title */}
          <div style={{ textAlign: 'center', borderTop: '2px solid #000', borderBottom: '2px solid #000', padding: '6px 0', marginBottom: '12px' }}>
            <div style={{ fontSize: '14pt', fontWeight: 'bold' }}>
              ভেন্ডার লেনদেন বিবরণী
            </div>
          </div>

          {/* Tender & Date Info */}
          <div style={{ marginBottom: '12px', fontSize: '10pt' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <div>
                <strong>টেন্ডার আইডি:</strong> {tender?.id?.slice(0, 8).toUpperCase()}
              </div>
              <div>
                <strong>তারিখ:</strong> {formatDate(new Date().toISOString().split("T")[0])}
              </div>
            </div>
            <div>
              <strong>কাজের নাম:</strong> {tender?.project_name}
            </div>
          </div>

          {/* Vendor Info Box */}
          <div style={{ border: '2px solid #000', padding: '8px', marginBottom: '12px', fontSize: '10pt' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <div style={{ flex: 1 }}>
                <strong>ভেন্ডার নাম:</strong> {vendor?.name}
              </div>
              <div style={{ flex: 1, textAlign: 'right' }}>
                <strong>ফোন:</strong> {vendor?.phone || "—"}
              </div>
            </div>
            <div style={{ borderTop: '1px solid #999', paddingTop: '6px', marginTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
              <div><strong>মোট লেনদেন:</strong></div>
              <div style={{ fontSize: '12pt', fontWeight: 'bold' }}>{formatCurrency(stats.totalPurchases)}</div>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 no-print">
            <Link
              href={`/tender/${params.tenderId}/purchases`}
              className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              Back to purchases
            </Link>
            
            <Button
              onClick={() => window.print()}
              variant="outline"
              className="gap-1.5 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 md:h-10"
            >
              <Printer className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Print Statement</span>
              <span className="xs:hidden">Print</span>
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 truncate">
                {vendor.name}
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-600">
                {vendor.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {vendor.phone}
                  </div>
                )}
                {vendor.categoryIds && vendor.categoryIds.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {vendor.categoryIds.map((catId: string) => {
                      const cat = categories.find((c) => c.id === catId);
                      return cat ? (
                        <span
                          key={catId}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                        >
                          {cat.name_bn || cat.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 no-print">
              <Button
                onClick={handleEditVendor}
                variant="outline"
                className="gap-1.5 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 md:h-10 px-2.5 sm:px-3 md:px-4"
              >
                <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Edit Profile</span>
                <span className="xs:hidden">Edit</span>
              </Button>
              <Button
                onClick={() =>
                  router.push(
                    `/tender/${params.tenderId}/purchases/add?vendor=${vendor.id}`
                  )
                }
                variant="outline"
                className="gap-1.5 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 md:h-10 px-2.5 sm:px-3 md:px-4"
              >
                <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Add Purchase</span>
                <span className="xs:hidden">Add</span>
              </Button>
              <Button
                onClick={() => setShowPaymentForm(true)}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <CreditCard className="h-4 w-4" />
                Record Payment
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 no-print">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Total Purchases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalPurchases)}
              </div>
              <p className="text-xs opacity-80 mt-1">
                {stats.purchaseCount} transactions
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Total Paid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalPaid)}
              </div>
              <p className="text-xs opacity-80 mt-1">
                {stats.paymentCount} payments
              </p>
            </CardContent>
          </Card>

          <Card
            className={`bg-gradient-to-br ${
              stats.balance > 0
                ? "from-red-500 to-red-600"
                : "from-emerald-500 to-emerald-600"
            } text-white`}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                {stats.balance > 0 ? "Due Balance" : "Overpaid"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(Math.abs(stats.balance))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Payment Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalPurchases > 0
                  ? Math.round((stats.totalPaid / stats.totalPurchases) * 100)
                  : 0}
                %
              </div>
              <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                <div
                  className="bg-white rounded-full h-2 transition-all"
                  style={{
                    width: `${
                      stats.totalPurchases > 0
                        ? Math.min(
                            (stats.totalPaid / stats.totalPurchases) * 100,
                            100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Edit Vendor Form */}
        {showEditForm && (
          <Card className="mb-8 border-2 border-blue-200 shadow-lg">
            <CardHeader className="bg-blue-50">
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Edit className="h-5 w-5" />
                Edit Vendor Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleUpdateVendor} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vendorName">Vendor Name *</Label>
                    <Input
                      id="vendorName"
                      value={vendorEdit.name}
                      onChange={(e) =>
                        setVendorEdit((p) => ({ ...p, name: e.target.value }))
                      }
                      required
                      disabled={updating}
                    />
                  </div>
                  <div>
                    <Label htmlFor="vendorPhone">Phone Number</Label>
                    <Input
                      id="vendorPhone"
                      value={vendorEdit.phone}
                      onChange={(e) =>
                        setVendorEdit((p) => ({ ...p, phone: e.target.value }))
                      }
                      disabled={updating}
                    />
                  </div>
                </div>

                <div>
                  <Label>Categories (select multiple)</Label>
                  <div className="border rounded-md p-4 max-h-48 overflow-y-auto bg-white">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {categories.map((c) => (
                        <label
                          key={c.id}
                          className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={vendorEdit.categoryIds.includes(c.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setVendorEdit((p) => ({
                                  ...p,
                                  categoryIds: [...p.categoryIds, c.id],
                                }));
                              } else {
                                setVendorEdit((p) => ({
                                  ...p,
                                  categoryIds: p.categoryIds.filter(
                                    (id) => id !== c.id
                                  ),
                                }));
                              }
                            }}
                            disabled={updating}
                            className="rounded"
                          />
                          <span className="text-sm">
                            {c.name_bn || c.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="vendorNotes">Notes</Label>
                  <textarea
                    id="vendorNotes"
                    value={vendorEdit.notes}
                    onChange={(e) =>
                      setVendorEdit((p) => ({ ...p, notes: e.target.value }))
                    }
                    disabled={updating}
                    rows={3}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    placeholder="Additional notes about this vendor..."
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={updating}>
                    {updating ? "Updating..." : "Update Vendor"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEditForm(false)}
                    disabled={updating}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Payment Form */}
        {showPaymentForm && (
          <Card className="mb-8 border-2 border-green-200 shadow-lg">
            <CardHeader className="bg-green-50">
              <CardTitle className="flex items-center gap-2 text-green-900">
                <CreditCard className="h-5 w-5" />
                Record Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handlePayment} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="paymentDate">Payment Date *</Label>
                    <Input
                      id="paymentDate"
                      type="date"
                      value={paymentData.paymentDate}
                      onChange={(e) =>
                        setPaymentData({
                          ...paymentData,
                          paymentDate: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="amount">Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={paymentData.amount}
                      onChange={(e) =>
                        setPaymentData({
                          ...paymentData,
                          amount: e.target.value,
                        })
                      }
                      placeholder="0.00"
                      required
                    />
                    {paymentData.paymentMethod === "mfs" && paymentData.mfsCharge && paymentData.amount && (
                      <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
                        <div className="flex justify-between mb-1">
                          <span className="text-slate-600">Base Amount:</span>
                          <span className="font-medium">৳{Number(paymentData.amount).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between mb-1">
                          <span className="text-slate-600">MFS Charge (1.85%):</span>
                          <span className="font-medium">৳{(Number(paymentData.amount) * 0.0185).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between mb-1">
                          <span className="text-slate-600">Transaction Fee:</span>
                          <span className="font-medium">৳10.00</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-yellow-300">
                          <span className="font-semibold text-slate-800">Final Total:</span>
                          <span className="font-bold text-lg text-green-700">৳{(Number(paymentData.amount) * 1.0185 + 10).toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <select
                      id="paymentMethod"
                      value={paymentData.paymentMethod}
                      onChange={(e) =>
                        setPaymentData({
                          ...paymentData,
                          paymentMethod: e.target.value,
                          mfsCharge: e.target.value === "mfs" ? paymentData.mfsCharge : false,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="cash">Cash</option>
                      <option value="bank">Bank Transfer</option>
                      <option value="check">Check</option>
                      <option value="mfs">MFS (bKash, Nagad)</option>
                    </select>
                    {paymentData.paymentMethod === "mfs" && (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="mfsCharge"
                          checked={paymentData.mfsCharge}
                          onChange={(e) =>
                            setPaymentData({
                              ...paymentData,
                              mfsCharge: e.target.checked,
                            })
                          }
                          className="rounded"
                        />
                        <label htmlFor="mfsCharge" className="text-sm text-slate-700">
                          Add MFS charge (1.85% + ৳10)
                        </label>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="reference">Reference/TxID</Label>
                    <Input
                      id="reference"
                      value={paymentData.reference}
                      onChange={(e) =>
                        setPaymentData({
                          ...paymentData,
                          reference: e.target.value,
                        })
                      }
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    value={paymentData.notes}
                    onChange={(e) =>
                      setPaymentData({ ...paymentData, notes: e.target.value })
                    }
                    rows={2}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Optional notes..."
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {submitting ? "Recording..." : "Record Payment"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPaymentForm(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
                      <span className="no-print">Date</span>
                      <span className="print-only" style={{ display: 'none' }}>তারিখ</span>
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
                      <span className="no-print">Status</span>
                      <span className="print-only" style={{ display: 'none' }}>পেমেন্ট</span>
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
                      <span className="no-print">Details</span>
                      <span className="print-only" style={{ display: 'none' }}>বিবরণ</span>
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wide">
                      <span className="no-print">Qty</span>
                      <span className="print-only" style={{ display: 'none' }}>পরিমাণ</span>
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wide">
                      <span className="no-print">Amount</span>
                      <span className="print-only" style={{ display: 'none' }}>টাকা</span>
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wide">
                      <span className="no-print">Balance</span>
                      <span className="print-only" style={{ display: 'none' }}>বাকি</span>
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wide no-print">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {transactions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-slate-500"
                      >
                        No transactions yet
                      </td>
                    </tr>
                  ) : (
                    (() => {
                      let runningBalance = 0;
                      return transactions.map((txn) => {
                        // For purchases, check if they were paid immediately (cash/bank)
                        if (txn.type === "purchase") {
                          // If payment method is cash or bank, it's already paid (no balance change)
                          if (txn.payment_method === "cash" || txn.payment_method === "bank") {
                            // Purchase was paid immediately, so no due amount
                          } else {
                            // Due payment - add to balance
                            runningBalance += txn.amount;
                          }
                        } else {
                          // Manual payment - subtract from balance
                          runningBalance -= txn.amount;
                        }

                        return (
                          <tr key={txn.id} className="hover:bg-slate-50">
                            <td className="px-3 py-3 text-sm text-slate-900">
                              {formatDate(txn.date)}
                            </td>
                            <td className="px-3 py-3">
                              {txn.type === "purchase" ? (
                                txn.payment_method === "cash" || txn.payment_method === "bank" || txn.payment_method === "mfs" ? (
                                  <div className="text-xs">
                                    <span className="inline-flex px-2 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                                      <span className="no-print">Paid via {txn.payment_method === "mfs" ? "MFS" : txn.payment_method === "cash" ? "Cash" : "Bank"}</span>
                                    </span>
                                    <span className="print-only" style={{ display: 'none' }}>{txn.payment_method === "mfs" ? "এমএফএস দিয়ে প্রদত্ত" : txn.payment_method === "cash" ? "ক্যাশ দিয়ে প্রদত্ত" : "ব্যাংক দিয়ে প্রদত্ত"}</span>
                                  </div>
                                ) : (
                                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                    <span className="no-print">Due</span>
                                    <span className="print-only" style={{ display: 'none' }}>বকেয়া বিল</span>
                                  </span>
                                )
                              ) : (
                                <div className="text-xs">
                                  <span className="inline-flex px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                                    <span className="no-print">Payment via {txn.payment_method === "mfs" ? "MFS" : txn.payment_method === "cash" ? "Cash" : txn.payment_method === "bank" ? "Bank" : txn.payment_method === "check" ? "Check" : "Other"}</span>
                                  </span>
                                  <span className="print-only" style={{ display: 'none' }}>{txn.payment_method === "mfs" ? "এমএফএস পেমেন্ট" : txn.payment_method === "cash" ? "ক্যাশ পেমেন্ট" : txn.payment_method === "bank" ? "ব্যাংক পেমেন্ট" : "চেক পেমেন্ট"}</span>
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-3 text-sm text-slate-900">
                              {txn.item_name || "-"}
                              {txn.notes && (
                                <p className="text-xs text-slate-500 mt-1">
                                  {txn.notes}
                                </p>
                              )}
                            </td>
                            <td className="px-3 py-3 text-sm text-slate-600 text-center">
                              {txn.quantity
                                ? `${txn.quantity} ${txn.unit}`
                                : "-"}
                            </td>
                            <td
                              className={`px-4 py-3 text-sm font-medium text-right ${
                                txn.type === "purchase"
                                  ? "text-red-600"
                                  : "text-green-600"
                              }`}
                            >
                              {txn.type === "purchase" ? "+" : "-"}
                              {formatCurrency(txn.amount)}
                            </td>
                            <td
                              className={`px-4 py-3 text-sm font-bold text-right ${
                                runningBalance > 0
                                  ? "text-red-600"
                                  : runningBalance < 0
                                  ? "text-green-600"
                                  : "text-slate-600"
                              }`}
                            >
                              {formatCurrency(Math.abs(runningBalance))}
                              {runningBalance > 0
                                ? " due"
                                : runningBalance < 0
                                ? " overpaid"
                                : ""}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center  no-printjustify-center gap-1">
                                {txn.type === "purchase" && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEditTransaction(txn)}
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteTransaction(txn)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Print Footer - Only visible in print */}
        <div className="print-footer">
          <div style={{ marginTop: '20px', paddingTop: '12px', borderTop: '1px solid #ccc', fontSize: '9pt', color: '#666' }}>
            <div>
              <strong>Generated by:</strong> {currentUser?.full_name || currentUser?.email || "User"}
            </div>
            <div>
              <strong>Generated on:</strong> {formatDate(new Date().toISOString().split("T")[0])} at {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        /* Hide print elements on screen */
        .print-header,
        .print-footer {
          display: none;
        }

        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          @page {
            size: A4 portrait;
            margin: 15mm 12mm;
          }

          body {
            background: white !important;
            font-size: 10pt !important;
            font-family: 'Noto Sans Bengali', 'SolaimanLipi', Arial, sans-serif !important;
            color: #000 !important;
            line-height: 1.4 !important;
          }

          /* Hide everything except content */
          aside, nav, header, footer,
          .sidebar, [class*="sidebar"],
          .no-print,
          button, svg {
            display: none !important;
          }

          /* Show print elements */
          .print-header,
          .print-footer {
            display: block !important;
          }

          main {
            overflow: visible !important;
          }

          .min-h-screen {
            min-height: auto !important;
          }

          .bg-gradient-to-br {
            background: white !important;
          }

          .lg\\:pl-8,
          .pl-20 {
            padding-left: 0 !important;
          }

          .px-4 {
            padding-left: 0 !important;
            padding-right: 0 !important;
          }

          .py-8 {
            padding-top: 0 !important;
            padding-bottom: 0 !important;
          }

          /* Show print header */
          .print-only {
            display: block !important;
          }

          /* Show print-only elements */
          .print-only {
            display: inline !important;
          }

          th .print-only {
            display: inline !important;
          }

          /* Show Bengali in badges for print */
          .rounded-full .print-only {
            display: inline !important;
          }

          /* Clean header styling */
          .print-only h1 {
            font-size: 18pt !important;
            font-weight: 700 !important;
            color: #000 !important;
            margin: 0 0 0.2rem 0 !important;
          }

          .print-only h2 {
            font-size: 14pt !important;
            font-weight: 700 !important;
            color: #000 !important;
            margin: 0 !important;
            padding: 0.3rem 0 !important;
          }

          .print-only p {
            font-size: 9pt !important;
            margin: 0 !important;
            color: #333 !important;
          }

          .print-only .text-xs {
            font-size: 9pt !important;
          }

          .print-only .text-sm {
            font-size: 10pt !important;
          }

          .print-only .text-lg {
            font-size: 13pt !important;
          }

          .print-only table {
            border: none !important;
            margin: 0 !important;
          }

          .print-only table td {
            padding: 0.15rem 0.3rem !important;
            border: none !important;
            font-size: 10pt !important;
            color: #000 !important;
          }

          .print-only table td strong {
            font-weight: 600 !important;
          }

          .print-only .border-y-2 {
            border-top: 2px solid #000 !important;
            border-bottom: 2px solid #000 !important;
          }

          .print-only .border-2 {
            border: 2px solid #000 !important;
          }

          .print-only .border-black {
            border-color: #000 !important;
          }

          .print-only .p-3 {
            padding: 0.4rem !important;
          }

          .print-only .mb-4 {
            margin-bottom: 0.5rem !important;
          }

          .print-only .mb-3 {
            margin-bottom: 0.3rem !important;
          }

          .print-only .mb-1 {
            margin-bottom: 0.1rem !important;
          }

          .print-only .py-1 {
            padding-top: 0.15rem !important;
            padding-bottom: 0.15rem !important;
          }

          .print-only .py-2 {
            padding-top: 0.3rem !important;
            padding-bottom: 0.3rem !important;
          }

          .print-only .pt-2 {
            padding-top: 0.3rem !important;
          }

          /* Hide screen elements */
          [class*="CardHeader"],
          .no-print {
            display: none !important;
          }

          [class*="CardContent"] {
            padding: 0 !important;
          }

          /* Clean card styling */
          .border,
          .border-slate-200,
          .border-slate-100,
          .rounded-lg,
          .rounded-xl {
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }

          .mb-8 {
            margin-bottom: 0 !important;
          }

          /* Table styling */
          table {
            border-collapse: collapse !important;
            page-break-inside: auto !important;
            width: 100% !important;
            margin-top: 0.5rem !important;
          }

          thead {
            background: #e8e8e8 !important;
          }

          tr {
            page-break-inside: avoid !important;
            page-break-after: auto !important;
          }

          thead tr {
            display: table-header-group !important;
          }

          th {
            padding: 0.35rem 0.4rem !important;
            font-size: 9pt !important;
            font-weight: 700 !important;
            color: #000 !important;
            text-transform: uppercase !important;
            border: 1px solid #666 !important;
            white-space: nowrap !important;
            background: #e8e8e8 !important;
          }

          th .no-print {
            display: none !important;
          }

          th .print-only {
            display: inline !important;
          }

          /* Hide action column */
          th:last-child,
          td:last-child {
            display: none !important;
          }

          td {
            padding: 0.25rem 0.4rem !important;
            font-size: 10.5pt !important;
            color: #000 !important;
            border: 1px solid #ccc !important;
            vertical-align: middle !important;
          }

          tbody tr {
            border: 1px solid #ccc !important;
          }

          tbody tr:nth-child(even) {
            background: #fafafa !important;
          }

          tbody tr:hover {
            background: transparent !important;
          }

          /* Hide badges, show text only */
          .rounded-full {
            background: transparent !important;
            border: none !important;
            padding: 0 !important;
            border-radius: 0 !important;
          }

          .rounded-full .no-print {
            display: none !important;
          }

          .rounded-full .print-only {
            display: inline !important;
            font-size: 10pt !important;
            font-weight: 600 !important;
          }

          /* Color adjustments */
          .text-red-600,
          .text-red-800 {
            color: #c00 !important;
            font-weight: 600 !important;
          }

          .text-green-600,
          .text-green-800 {
            color: #080 !important;
            font-weight: 600 !important;
          }

          .text-blue-800 {
            color: #004 !important;
          }

          .text-green-800 {
            color: #040 !important;
          }

          .bg-blue-100,
          .bg-green-100,
          .bg-red-100 {
            background: transparent !important;
            border: none !important;
            padding: 0 !important;
          }

          /* Hide all interactive elements */
          button,
          svg {
            display: none !important;
          }

          /* Text sizes */
          .text-xs {
            font-size: 9.5pt !important;
          }

          .text-sm {
            font-size: 10.5pt !important;
          }

          .text-base {
            font-size: 11pt !important;
          }

          /* Font weights */
          .font-bold {
            font-weight: 700 !important;
          }

          .font-semibold {
            font-weight: 600 !important;
          }

          .font-medium {
            font-weight: 500 !important;
          }

          /* Text alignment */
          .text-right {
            text-align: right !important;
          }

          .text-left {
            text-align: left !important;
          }

          .text-center {
            text-align: center !important;
          }

          /* Notes styling */
          .text-xs.text-slate-500 {
            font-size: 9pt !important;
            color: #666 !important;
            font-style: italic !important;
          }

          /* Balance highlight */
          td:nth-last-child(2) {
            font-weight: 700 !important;
          }

          /* Clean layout */
          .max-w-7xl,
          .max-w-4xl {
            max-width: 100% !important;
            margin: 0 !important;
          }

          .mx-auto {
            margin-left: 0 !important;
            margin-right: 0 !important;
          }

          .overflow-x-auto {
            overflow: visible !important;
          }

          /* Bengali font support */
          .print-bn {
            font-family: 'Noto Sans Bengali', 'SolaimanLipi', Arial, sans-serif !important;
          }
        }
      `}</style>
    </div>
  );
}
