"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, FileText, Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils/format";

export default function VendorExpenseHubPage({
  params,
}: {
  params: { tenderId: string };
}) {
  const supabase = createClient();

  const [categories, setCategories] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [totalPurchasesAll, setTotalPurchasesAll] = useState(0);
  const [vendorTotals, setVendorTotals] = useState<
    Record<string, { purchases: number; paid: number }>
  >({});
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [adding, setAdding] = useState(false);
  const [editingVendor, setEditingVendor] = useState<any>(null);
  const [newVendor, setNewVendor] = useState({
    name: "",
    phone: "",
    categoryIds: [] as string[],
  });

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAll = async () => {
    const { data: categoryData } = await supabase
      .from("vendor_categories")
      .select("*")
      .eq("is_active", true)
      .order("name");

    const { data: vendorData } = await supabase
      .from("vendors")
      .select("*")
      .eq("is_active", true)
      .order("name");

    // Load vendor category mappings
    const { data: mappingsData } = await supabase
      .from("vendor_category_mappings")
      .select("vendor_id, category_id");

    // Attach category IDs to vendors
    const vendorsWithCategories = (vendorData || []).map((v) => ({
      ...v,
      categoryIds: mappingsData?.filter((m) => m.vendor_id === v.id).map((m) => m.category_id) || [],
    }));

    const { data: purchaseData } = await supabase
      .from("vendor_purchases")
      .select("vendor_id, total_cost")
      .eq("tender_id", params.tenderId);

    const { data: paymentData } = await supabase
      .from("vendor_payments")
      .select("vendor_id, amount")
      .eq("tender_id", params.tenderId);

    setCategories(categoryData || []);
    setVendors(vendorsWithCategories || []);
    setTotalPurchasesAll(
      purchaseData?.reduce((sum, p) => sum + Number(p.total_cost || 0), 0) || 0
    );

    const totals: Record<string, { purchases: number; paid: number }> = {};

    purchaseData?.forEach((p: any) => {
      if (!p.vendor_id) return;
      if (!totals[p.vendor_id]) {
        totals[p.vendor_id] = { purchases: 0, paid: 0 };
      }
      totals[p.vendor_id].purchases += Number(p.total_cost || 0);
    });

    paymentData?.forEach((p: any) => {
      if (!p.vendor_id) return;
      if (!totals[p.vendor_id]) {
        totals[p.vendor_id] = { purchases: 0, paid: 0 };
      }
      totals[p.vendor_id].paid += Number(p.amount || 0);
    });

    setVendorTotals(totals);
  };

  const filteredVendors = useMemo(() => {
    if (activeCategory === "all") return vendors;
    return vendors.filter((v) => 
      v.categoryIds && v.categoryIds.includes(activeCategory)
    );
  }, [vendors, activeCategory]);

  const totalDue = filteredVendors.reduce((sum, v) => {
    const t = vendorTotals[v.id];
    const balance = (t?.purchases || 0) - (t?.paid || 0);
    return sum + balance;
  }, 0);

  const totalPurchases = totalPurchasesAll;

  const addVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendor.name) return;

    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) return;

    setAdding(true);
    const { data: vendorData, error } = await supabase.from("vendors").insert({
      name: newVendor.name,
      phone: newVendor.phone || null,
      category_id: null, // Keep for backward compatibility
      tender_id: params.tenderId,
      created_by: userId,
    }).select().single();

    if (!error && vendorData && newVendor.categoryIds.length > 0) {
      // Insert category mappings
      await supabase.from("vendor_category_mappings").insert(
        newVendor.categoryIds.map((catId) => ({
          vendor_id: vendorData.id,
          category_id: catId,
        }))
      );
    }

    setAdding(false);
    if (!error) {
      setNewVendor({ name: "", phone: "", categoryIds: [] });
      loadAll();
    }
  };

  const handleEdit = (vendor: any) => {
    setEditingVendor(vendor);
    setNewVendor({
      name: vendor.name,
      phone: vendor.phone || "",
      categoryIds: vendor.categoryIds || [],
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVendor || !newVendor.name) return;

    setAdding(true);
    const { error } = await supabase
      .from("vendors")
      .update({
        name: newVendor.name,
        phone: newVendor.phone || null,
      })
      .eq("id", editingVendor.id);

    if (!error) {
      // Delete old category mappings
      await supabase
        .from("vendor_category_mappings")
        .delete()
        .eq("vendor_id", editingVendor.id);

      // Insert new category mappings
      if (newVendor.categoryIds.length > 0) {
        await supabase.from("vendor_category_mappings").insert(
          newVendor.categoryIds.map((catId) => ({
            vendor_id: editingVendor.id,
            category_id: catId,
          }))
        );
      }
    }

    setAdding(false);
    if (!error) {
      setEditingVendor(null);
      setNewVendor({ name: "", phone: "", categoryIds: [] });
      loadAll();
    }
  };

  const handleDelete = async (vendorId: string, vendorName: string) => {
    if (!confirm(`Delete vendor "${vendorName}"? This will mark it as inactive.`)) return;

    const { error } = await supabase
      .from("vendors")
      .update({ is_active: false })
      .eq("id", vendorId);

    if (!error) {
      loadAll();
    }
  };

  const cancelEdit = () => {
    setEditingVendor(null);
    setNewVendor({ name: "", phone: "", categoryIds: [] });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(254,243,199,0.6),rgba(255,255,255,0))]">
      <div className="bg-gradient-to-br from-amber-50 via-white to-slate-50 py-8">
        <div className="max-w-6xl mx-auto px-4 space-y-6 lg:pl-8 pl-20">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="text-center lg:text-left">
              <Link
                href={`/tender/${params.tenderId}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to tender dashboard
              </Link>
              <h1 className="text-3xl font-bold text-slate-900 mt-2">
                Vendor expenses
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Vendor purchases, payments, and dues.
              </p>
            </div>
            <Link href={`/tender/${params.tenderId}/expenses/overview`}>
              <Button variant="outline" className="gap-2">
                <FileText className="h-4 w-4" />
                All expenses
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-white/80 border-slate-200/70 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-500">
                  Total vendors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  {vendors.length}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 border-slate-200/70 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-500">
                  Total purchases (all time)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  {formatCurrency(totalPurchases)}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 border-slate-200/70 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-500">
                  Total due (filtered)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  {formatCurrency(totalDue)}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 border-slate-200/70 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-500">
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  {categories.length}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white/80 border-slate-200/70 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Plus className="h-4 w-4" />
                {editingVendor ? "Edit vendor" : "Add vendor"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="grid grid-cols-1 md:grid-cols-4 gap-4"
                onSubmit={editingVendor ? handleUpdate : addVendor}
              >
                <div className="md:col-span-2">
                  <Label htmlFor="vendorName">Name *</Label>
                  <Input
                    id="vendorName"
                    value={newVendor.name}
                    onChange={(e) =>
                      setNewVendor((p) => ({ ...p, name: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="vendorPhone">Phone</Label>
                  <Input
                    id="vendorPhone"
                    value={newVendor.phone}
                    onChange={(e) =>
                      setNewVendor((p) => ({ ...p, phone: e.target.value }))
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Categories (select multiple)</Label>
                  <div className="border rounded-md p-3 max-h-40 overflow-y-auto bg-white">
                    <div className="grid grid-cols-2 gap-2">
                      {categories.map((c) => (
                        <label
                          key={c.id}
                          className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={newVendor.categoryIds.includes(c.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewVendor((p) => ({
                                  ...p,
                                  categoryIds: [...p.categoryIds, c.id],
                                }));
                              } else {
                                setNewVendor((p) => ({
                                  ...p,
                                  categoryIds: p.categoryIds.filter(
                                    (id) => id !== c.id
                                  ),
                                }));
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{c.name_bn || c.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="md:col-span-4 flex gap-2">
                  <Button type="submit" disabled={adding}>
                    {adding
                      ? "Saving..."
                      : editingVendor
                      ? "Update vendor"
                      : "Add vendor"}
                  </Button>
                  {editingVendor && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={cancelEdit}
                      disabled={adding}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeCategory === "all" ? "default" : "outline"}
              onClick={() => setActiveCategory("all")}
              size="sm"
            >
              All
            </Button>
            {categories.map((c) => (
              <Button
                key={c.id}
                variant={activeCategory === c.id ? "default" : "outline"}
                onClick={() => setActiveCategory(c.id)}
                size="sm"
              >
                {c.name_bn || c.name}
              </Button>
            ))}
          </div>

          <Card className="bg-white/80 border-slate-200/70 shadow-sm">
            <CardHeader>
              <CardTitle>Vendors</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredVendors.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  No vendors yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredVendors.map((v) => {
                    const t = vendorTotals[v.id];
                    const purchases = t?.purchases || 0;
                    const paid = t?.paid || 0;
                    const balance = purchases - paid;
                    const showPaid = balance <= 0;
                    const displayAmount = showPaid ? paid : balance;

                    return (
                      <div
                        key={v.id}
                        className="border border-slate-200 rounded-lg p-4 bg-white group hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <Link
                            href={`/tender/${params.tenderId}/expenses/vendors/${v.id}`}
                            className="flex-1"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-semibold text-lg text-slate-900">
                                  {v.name}
                                </p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {v.categoryIds && v.categoryIds.length > 0 ? (
                                    v.categoryIds.map((catId: string) => {
                                      const cat = categories.find((c) => c.id === catId);
                                      return cat ? (
                                        <span
                                          key={catId}
                                          className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded"
                                        >
                                          {cat.name_bn || cat.name}
                                        </span>
                                      ) : null;
                                    })
                                  ) : (
                                    <span className="text-xs text-slate-400">No category</span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p
                                  className={`text-lg font-bold ${
                                    showPaid
                                      ? "text-emerald-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {formatCurrency(displayAmount)}
                                </p>
                              </div>
                            </div>
                          </Link>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.preventDefault();
                                handleEdit(v);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.preventDefault();
                                handleDelete(v.id, v.name);
                              }}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
