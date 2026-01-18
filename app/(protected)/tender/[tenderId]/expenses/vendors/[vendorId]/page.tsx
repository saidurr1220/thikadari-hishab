"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, CreditCard, FileText, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export default function VendorLedgerPage({
  params,
}: {
  params: { tenderId: string; vendorId: string };
}) {
  const supabase = createClient();
  const searchParams = useSearchParams();

  const [vendor, setVendor] = useState<any>(null);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [recentItems, setRecentItems] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [purchaseForm, setPurchaseForm] = useState({
    date: new Date().toISOString().split("T")[0],
    item: "",
    quantity: "",
    unit: "",
    unitPrice: "",
    transport: "",
    unload: "",
    total: "",
    notes: "",
    paymentStatus: "paid",
    paymentMethod: "cash",
    paymentAmount: "",
    paymentRef: "",
  });

  const [paymentForm, setPaymentForm] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    method: "cash",
    ref: "",
    notes: "",
  });

  const totals = useMemo(() => {
    const totalPurchases =
      purchases.reduce((sum, p) => sum + Number(p.total_cost || 0), 0) || 0;
    const totalPaid =
      payments.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
    return {
      totalPurchases,
      totalPaid,
      balance: totalPurchases - totalPaid,
    };
  }, [purchases, payments]);

  const computedTotal = useMemo(() => {
    const qty = parseFloat(purchaseForm.quantity || "0");
    const unitPrice = parseFloat(purchaseForm.unitPrice || "0");
    const transport = parseFloat(purchaseForm.transport || "0");
    const unload = parseFloat(purchaseForm.unload || "0");
    const manualTotal = parseFloat(purchaseForm.total || "0");

    if (purchaseForm.total !== "") return manualTotal;
    if (qty && unitPrice) return qty * unitPrice + transport + unload;
    return 0;
  }, [purchaseForm]);

  const mfsCharge = useMemo(() => {
    const amount = parseFloat(paymentForm.amount || "0");
    if (paymentForm.method !== "mfs" || !amount) return 0;
    return amount * 0.0185 + 10;
  }, [paymentForm]);

  useEffect(() => {
    loadAll();
    loadRecentItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRecentItems = async () => {
    const { data } = await supabase
      .from("vendor_purchases")
      .select("item_name, unit, unit_price")
      .eq("vendor_id", params.vendorId)
      .not("item_name", "is", null)
      .order("created_at", { ascending: false })
      .limit(10);
    
    if (data) {
      // Get unique items
      const uniqueItems = Array.from(
        new Map(data.map(item => [item.item_name, item])).values()
      );
      setRecentItems(uniqueItems);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    setError("");

    const { data: vendorData, error: vendorError } = await supabase
      .from("vendors")
      .select("*")
      .eq("id", params.vendorId)
      .single();

    if (vendorError) setError(vendorError.message);
    setVendor(vendorData);

    const { data: purchaseData, error: purchaseError } = await supabase
      .from("vendor_purchases")
      .select("*")
      .eq("tender_id", params.tenderId)
      .eq("vendor_id", params.vendorId)
      .order("purchase_date", { ascending: false });

    if (purchaseError) setError(purchaseError.message);
    setPurchases(purchaseData || []);

    const { data: paymentData, error: paymentError } = await supabase
      .from("vendor_payments")
      .select("*")
      .eq("tender_id", params.tenderId)
      .eq("vendor_id", params.vendorId)
      .order("payment_date", { ascending: false });

    if (paymentError) setError(paymentError.message);
    setPayments(paymentData || []);

    setLoading(false);
  };

  const submitPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) return;

    const qty = parseFloat(purchaseForm.quantity || "0");
    const unitPrice = parseFloat(purchaseForm.unitPrice || "0");
    const transport = parseFloat(purchaseForm.transport || "0");
    const unload = parseFloat(purchaseForm.unload || "0");
    const total = computedTotal;

    if (!total) {
      setError("Enter a total amount before saving.");
      return;
    }

    const { data: purchaseRow, error: insertError } = await supabase
      .from("vendor_purchases")
      .insert({
        tender_id: params.tenderId,
        vendor_id: params.vendorId,
        purchase_date: purchaseForm.date,
        item_name: purchaseForm.item || null,
        quantity: purchaseForm.quantity ? qty : null,
        unit: purchaseForm.unit || null,
        unit_price: purchaseForm.unitPrice ? unitPrice : null,
        transport_cost: purchaseForm.transport ? transport : null,
        unload_cost: purchaseForm.unload ? unload : null,
        total_cost: total,
        notes: purchaseForm.notes || null,
        created_by: userId,
      })
      .select("id")
      .single();

    if (insertError) {
      setError(insertError.message);
      return;
    }

    if (purchaseForm.paymentStatus === "paid") {
      const paidAmount = parseFloat(purchaseForm.paymentAmount || "0") || total;
      if (!paidAmount) {
        setError("Enter a payment amount or leave it empty to use total.");
        return;
      }

      const { error: paymentError } = await supabase
        .from("vendor_payments")
        .insert({
          tender_id: params.tenderId,
          vendor_id: params.vendorId,
          payment_date: purchaseForm.date,
          amount: paidAmount,
          payment_method: purchaseForm.paymentMethod as any,
          payment_ref: purchaseForm.paymentRef || null,
          notes: purchaseRow?.id
            ? `Payment for purchase ${purchaseRow.id}`
            : "Payment for purchase",
          created_by: userId,
        });

      if (paymentError) {
        setError(paymentError.message);
        return;
      }
    }

    setPurchaseForm((p) => ({
      ...p,
      item: "",
      quantity: "",
      unit: "",
      unitPrice: "",
      transport: "",
      unload: "",
      total: "",
      notes: "",
      paymentAmount: "",
      paymentRef: "",
    }));
    loadAll();
  };

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) return;

    const amount = parseFloat(paymentForm.amount || "0");
    if (!amount) {
      setError("Enter a payment amount.");
      return;
    }

    const { error: insertError } = await supabase
      .from("vendor_payments")
      .insert({
        tender_id: params.tenderId,
        vendor_id: params.vendorId,
        payment_date: paymentForm.date,
        amount,
        payment_method: paymentForm.method as any,
        payment_ref: paymentForm.ref || null,
        notes: paymentForm.notes || null,
        created_by: userId,
      });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setPaymentForm((p) => ({
      ...p,
      amount: "",
      ref: "",
      notes: "",
    }));
    loadAll();
  };

  const transactions = useMemo(() => {
    const purchaseRows = purchases.map((p) => ({
      id: p.id,
      type: "purchase",
      date: p.purchase_date,
      description: p.item_name || "Purchase",
      amount: p.total_cost || 0,
    }));

    const paymentRows = payments.map((p) => ({
      id: p.id,
      type: "payment",
      date: p.payment_date,
      description: p.payment_method,
      amount: p.amount || 0,
    }));

    return [...purchaseRows, ...paymentRows].sort((a, b) => {
      if (a.date === b.date) return a.type.localeCompare(b.type);
      return a.date > b.date ? -1 : 1;
    });
  }, [purchases, payments]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(254,243,199,0.6),rgba(255,255,255,0))]">
      <div className="bg-gradient-to-br from-amber-50 via-white to-slate-50 py-8">
        <div className="max-w-5xl mx-auto px-4 space-y-6">
          <Link
            href={`/tender/${params.tenderId}/expenses/vendors`}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to vendors
          </Link>

          <Card className="border-slate-200/70 bg-white/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-slate-900">
                {vendor?.name || "Vendor"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Total purchases</p>
                  <p className="font-semibold text-slate-900">
                    {formatCurrency(totals.totalPurchases)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Total paid</p>
                  <p className="font-semibold text-slate-900">
                    {formatCurrency(totals.totalPaid)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Balance</p>
                  <p
                    className={`font-semibold ${
                      totals.balance > 0 ? "text-red-600" : "text-emerald-600"
                    }`}
                  >
                    {formatCurrency(Math.abs(totals.balance))}
                  </p>
                </div>
              </div>
              {error ? (
                <p className="text-sm text-red-600 mt-3">{error}</p>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-slate-200/70 bg-white/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Add purchase
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitPurchase} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={purchaseForm.date}
                      onChange={(e) =>
                        setPurchaseForm((p) => ({ ...p, date: e.target.value }))
                      }
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>Item</Label>
                    
                    {/* Show recent items if available */}
                    {recentItems.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs text-gray-600 mb-1">Recent items from this vendor:</p>
                        <div className="flex flex-wrap gap-2">
                          {recentItems.map((item, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setPurchaseForm((p) => ({
                                  ...p,
                                  item: item.item_name,
                                  unit: item.unit || p.unit,
                                  unitPrice: item.unit_price?.toString() || p.unitPrice,
                                }));
                              }}
                              className="px-3 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-full transition-colors"
                            >
                              {item.item_name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <Input
                      placeholder="Sand / Cement / Service"
                      value={purchaseForm.item}
                      onChange={(e) =>
                        setPurchaseForm((p) => ({ ...p, item: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Input
                      placeholder="Optional notes"
                      value={purchaseForm.notes}
                      onChange={(e) =>
                        setPurchaseForm((p) => ({ ...p, notes: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      placeholder="0"
                      value={purchaseForm.quantity}
                      onChange={(e) =>
                        setPurchaseForm((p) => ({
                          ...p,
                          quantity: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Unit</Label>
                    <Input
                      placeholder="Truck / Bag"
                      value={purchaseForm.unit}
                      onChange={(e) =>
                        setPurchaseForm((p) => ({ ...p, unit: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Unit price</Label>
                    <Input
                      placeholder="0"
                      value={purchaseForm.unitPrice}
                      onChange={(e) =>
                        setPurchaseForm((p) => ({
                          ...p,
                          unitPrice: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Total</Label>
                    <Input
                      placeholder={computedTotal ? `${computedTotal}` : "0"}
                      value={purchaseForm.total}
                      onChange={(e) =>
                        setPurchaseForm((p) => ({ ...p, total: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Transport</Label>
                    <Input
                      placeholder="0"
                      value={purchaseForm.transport}
                      onChange={(e) =>
                        setPurchaseForm((p) => ({
                          ...p,
                          transport: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Unload</Label>
                    <Input
                      placeholder="0"
                      value={purchaseForm.unload}
                      onChange={(e) =>
                        setPurchaseForm((p) => ({
                          ...p,
                          unload: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Payment status</Label>
                    <select
                      className="w-full h-10 border rounded-md px-3 text-sm"
                      value={purchaseForm.paymentStatus}
                      onChange={(e) =>
                        setPurchaseForm((p) => ({
                          ...p,
                          paymentStatus: e.target.value,
                        }))
                      }
                    >
                      <option value="paid">Paid now</option>
                      <option value="due">Due (pay later)</option>
                    </select>
                  </div>
                  <div>
                    <Label>Payment method</Label>
                    <select
                      className="w-full h-10 border rounded-md px-3 text-sm"
                      value={purchaseForm.paymentMethod}
                      onChange={(e) =>
                        setPurchaseForm((p) => ({
                          ...p,
                          paymentMethod: e.target.value,
                        }))
                      }
                      disabled={purchaseForm.paymentStatus !== "paid"}
                    >
                      <option value="cash">Cash</option>
                      <option value="bank">Bank</option>
                      <option value="mfs">MFS</option>
                    </select>
                  </div>
                  <div>
                    <Label>Paid amount</Label>
                    <Input
                      placeholder={computedTotal ? `${computedTotal}` : "0"}
                      value={purchaseForm.paymentAmount}
                      onChange={(e) =>
                        setPurchaseForm((p) => ({
                          ...p,
                          paymentAmount: e.target.value,
                        }))
                      }
                      disabled={purchaseForm.paymentStatus !== "paid"}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Payment reference</Label>
                    <Input
                      placeholder="Optional"
                      value={purchaseForm.paymentRef}
                      onChange={(e) =>
                        setPurchaseForm((p) => ({
                          ...p,
                          paymentRef: e.target.value,
                        }))
                      }
                      disabled={purchaseForm.paymentStatus !== "paid"}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" className="w-full">
                      Save purchase
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-slate-200/70 bg-white/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No purchases or payments yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {transactions.map((t) => (
                    <div
                      key={`${t.type}-${t.id}`}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-slate-100 p-2 text-slate-600">
                          {t.type === "purchase" ? (
                            <Package className="h-4 w-4" />
                          ) : (
                            <CreditCard className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {t.description}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDate(t.date)}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`text-right font-semibold ${
                          t.type === "purchase"
                            ? "text-red-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {t.type === "purchase" ? "-" : "+"}
                        {formatCurrency(t.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {totals.balance > 0 && (
            <Card className="border-slate-200/70 bg-white/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Record payment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={submitPayment}
                  className="grid grid-cols-1 md:grid-cols-4 gap-4"
                >
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={paymentForm.date}
                      onChange={(e) =>
                        setPaymentForm((p) => ({ ...p, date: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Amount</Label>
                    <Input
                      placeholder="0"
                      value={paymentForm.amount}
                      onChange={(e) =>
                        setPaymentForm((p) => ({ ...p, amount: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label>Method</Label>
                    <select
                      className="w-full h-10 border rounded-md px-3 text-sm"
                      value={paymentForm.method}
                      onChange={(e) =>
                        setPaymentForm((p) => ({ ...p, method: e.target.value }))
                      }
                    >
                      <option value="cash">Cash</option>
                      <option value="bank">Bank</option>
                      <option value="mfs">MFS</option>
                    </select>
                  </div>
                  <div className="md:col-span-4">
                    <Label>Reference</Label>
                    <Input
                      placeholder="Optional"
                      value={paymentForm.ref}
                      onChange={(e) =>
                        setPaymentForm((p) => ({ ...p, ref: e.target.value }))
                      }
                    />
                  </div>
                  <div className="md:col-span-4">
                    <Label>Notes</Label>
                    <Input
                      placeholder="Optional"
                      value={paymentForm.notes}
                      onChange={(e) =>
                        setPaymentForm((p) => ({ ...p, notes: e.target.value }))
                      }
                    />
                  </div>
                  {paymentForm.method === "mfs" && (
                    <p className="text-xs text-slate-500 md:col-span-4">
                      MFS charge: {formatCurrency(mfsCharge)} (added to expenses)
                    </p>
                  )}
                  <div className="md:col-span-4">
                    <Button type="submit" className="w-full">
                      Add payment
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Link
            href={`/tender/${params.tenderId}/expenses/overview`}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            <FileText className="h-4 w-4" />
            View all expenses
          </Link>
        </div>
      </div>
    </div>
  );
}
