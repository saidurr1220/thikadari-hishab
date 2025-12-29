"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, User } from "lucide-react";

export default function AddPurchasePage({
  params,
}: {
  params: { tenderId: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");

  const [vendors, setVendors] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [recentItems, setRecentItems] = useState<any[]>([]);
  const [vendorProducts, setVendorProducts] = useState<any[]>([]);

  const [purchaseType, setPurchaseType] = useState<"material" | "vendor">(
    "material"
  );
  const [isNewVendor, setIsNewVendor] = useState(false);

  const [formData, setFormData] = useState({
    purchaseDate: new Date().toISOString().split("T")[0],
    vendorId: "",
    newVendorName: "",
    newVendorPhone: "",
    newVendorCategoryIds: [] as string[],
    materialId: "",
    customItemName: "",
    quantity: "",
    unit: "",
    unitRate: "",
    transportCost: "",
    unloadCost: "",
    totalAmount: "",
    paymentMethod: "cash" as "cash" | "bank" | "due" | "mfs",
    paymentRef: "",
    notes: "",
    mfsCharge: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const supabase = createClient();

    const [vendorsRes, materialsRes, categoriesRes] = await Promise.all([
      supabase
        .from("vendors")
        .select("*")
        .eq("tender_id", params.tenderId)
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("materials")
        .select("*")
        .eq("is_active", true)
        .order("name_bn"),
      supabase
        .from("vendor_categories")
        .select("*")
        .eq("is_active", true)
        .order("name"),
    ]);

    setVendors(vendorsRes.data || []);
    setMaterials(materialsRes.data || []);
    setCategories(categoriesRes.data || []);

    // Auto-select vendor if provided in URL
    const preselectedVendorId = searchParams.get("vendor");
    if (preselectedVendorId && vendorsRes.data) {
      const vendor = vendorsRes.data.find(
        (v: any) => v.id === preselectedVendorId
      );
      if (vendor) {
        setFormData((prev) => ({
          ...prev,
          vendorId: preselectedVendorId,
        }));
        // Set purchase type to vendor if coming from vendor page
        setPurchaseType("vendor");
        // Load recent items for this vendor
        await loadRecentItems(preselectedVendorId);
      }
    }

    setLoadingData(false);
  };

  const loadRecentItems = async (vendorId: string) => {
    const supabase = createClient();

    // Get vendor products
    const { data: productsData } = await supabase
      .from("vendor_products")
      .select("*, materials(name_bn)")
      .eq("vendor_id", vendorId)
      .order("last_unit_price", { ascending: false });

    if (productsData) {
      setVendorProducts(productsData);
    }

    // Get recent purchases from this vendor
    const { data } = await supabase
      .from("vendor_purchases")
      .select("item_name, unit, unit_price")
      .eq("vendor_id", vendorId)
      .not("item_name", "is", null)
      .order("created_at", { ascending: false })
      .limit(10);

    if (data) {
      // Get unique items
      const uniqueItems = Array.from(
        new Map(data.map((item) => [item.item_name, item])).values()
      );
      setRecentItems(uniqueItems);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Load recent items when vendor changes
    if (name === "vendorId" && value) {
      loadRecentItems(value);
    }

    // Auto-calculate total
    if (
      name === "quantity" ||
      name === "unitRate" ||
      name === "transportCost" ||
      name === "unloadCost"
    ) {
      const qty =
        name === "quantity" ? parseFloat(value) : parseFloat(formData.quantity);
      const rate =
        name === "unitRate" ? parseFloat(value) : parseFloat(formData.unitRate);
      const transport =
        name === "transportCost"
          ? parseFloat(value || "0")
          : parseFloat(formData.transportCost || "0");
      const unload =
        name === "unloadCost"
          ? parseFloat(value || "0")
          : parseFloat(formData.unloadCost || "0");

      if (!isNaN(qty) && !isNaN(rate)) {
        const baseAmount = qty * rate;
        const totalWithCosts = baseAmount + transport + unload;
        setFormData((prev) => ({
          ...prev,
          totalAmount: totalWithCosts.toFixed(2),
        }));
      }
    }

    // Auto-fill unit from material
    if (name === "materialId" && value) {
      const material = materials.find((m) => m.id === value);
      if (material) {
        setFormData((prev) => ({
          ...prev,
          unit: material.unit || "",
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not authenticated");

      let vendorId = formData.vendorId;

      // Create new vendor if needed
      if (isNewVendor && formData.newVendorName) {
        const { data: newVendor, error: vendorError } = await supabase
          .from("vendors")
          .insert({
            name: formData.newVendorName,
            phone: formData.newVendorPhone || null,
            category_id: null, // Keep for backward compatibility
            tender_id: params.tenderId,
            created_by: auth.user.id,
          })
          .select()
          .single();

        if (vendorError) throw vendorError;
        vendorId = newVendor.id;

        // Insert category mappings if any selected
        if (formData.newVendorCategoryIds.length > 0) {
          await supabase.from("vendor_category_mappings").insert(
            formData.newVendorCategoryIds.map((catId) => ({
              vendor_id: newVendor.id,
              category_id: catId,
            }))
          );
        }
      }

      // Calculate final amount with MFS charge if applicable
      let finalAmount = parseFloat(formData.totalAmount);
      if (formData.paymentMethod === "mfs" && formData.mfsCharge) {
        const mfsCharge = finalAmount * 0.0185 + 10; // 1.85% + ৳10
        finalAmount = parseFloat((finalAmount + mfsCharge).toFixed(2));
      }

      if (purchaseType === "material") {
        // Create material purchase
        const { error: purchaseError, data: purchaseData } = await supabase
          .from("material_purchases")
          .insert({
            tender_id: params.tenderId,
            purchase_date: formData.purchaseDate,
            material_id: formData.materialId || null,
            custom_item_name: formData.customItemName || null,
            quantity: parseFloat(formData.quantity),
            unit: formData.unit,
            unit_rate: parseFloat(formData.unitRate),
            total_amount: parseFloat(formData.totalAmount),
            transport_vara_cost: formData.transportCost
              ? parseFloat(formData.transportCost)
              : null,
            unload_cost: formData.unloadCost
              ? parseFloat(formData.unloadCost)
              : null,
            vendor_id: vendorId || null,
            supplier: vendorId
              ? vendors.find((v) => v.id === vendorId)?.name
              : formData.newVendorName || null,
            payment_method: formData.paymentMethod,
            payment_ref: formData.paymentRef || null,
            notes: formData.notes || null,
            created_by: auth.user.id,
          })
          .select()
          .single();

        if (purchaseError) throw purchaseError;

        // Auto-create payment if vendor exists and payment method is cash, bank, or mfs
        if (
          vendorId &&
          (formData.paymentMethod === "cash" ||
            formData.paymentMethod === "bank" ||
            formData.paymentMethod === "mfs")
        ) {
          const paymentNotes =
            formData.paymentMethod === "mfs" && formData.mfsCharge
              ? `Auto payment for material: ${
                  formData.customItemName || "Material purchase"
                } (incl. MFS charge)`
              : `Auto payment for material: ${
                  formData.customItemName || "Material purchase"
                }`;

          const { error: paymentError } = await supabase
            .from("vendor_payments")
            .insert({
              tender_id: params.tenderId,
              vendor_id: vendorId,
              payment_date: formData.purchaseDate,
              amount: finalAmount,
              payment_method: formData.paymentMethod,
              payment_ref: formData.paymentRef || null,
              notes: paymentNotes,
              created_by: auth.user.id,
            });

          if (paymentError) throw paymentError;
        }
      } else {
        // Create vendor purchase
        if (!vendorId)
          throw new Error("Vendor is required for vendor purchases");

        const { error: purchaseError, data: purchaseData } = await supabase
          .from("vendor_purchases")
          .insert({
            tender_id: params.tenderId,
            vendor_id: vendorId,
            purchase_date: formData.purchaseDate,
            item_name: formData.customItemName,
            quantity: parseFloat(formData.quantity),
            unit: formData.unit,
            unit_price: parseFloat(formData.unitRate),
            base_cost:
              parseFloat(formData.quantity) * parseFloat(formData.unitRate),
            transport_cost: formData.transportCost
              ? parseFloat(formData.transportCost)
              : null,
            unload_cost: formData.unloadCost
              ? parseFloat(formData.unloadCost)
              : null,
            total_cost: parseFloat(formData.totalAmount),
            notes: formData.notes || null,
            created_by: auth.user.id,
          })
          .select()
          .single();

        if (purchaseError) throw purchaseError;

        // Auto-create payment if payment method is cash, bank, or mfs
        if (
          formData.paymentMethod === "cash" ||
          formData.paymentMethod === "bank" ||
          formData.paymentMethod === "mfs"
        ) {
          const paymentNotes =
            formData.paymentMethod === "mfs" && formData.mfsCharge
              ? `Auto payment for purchase: ${formData.customItemName} (incl. MFS charge)`
              : `Auto payment for purchase: ${formData.customItemName}`;

          const { error: paymentError } = await supabase
            .from("vendor_payments")
            .insert({
              tender_id: params.tenderId,
              vendor_id: vendorId,
              payment_date: formData.purchaseDate,
              amount: finalAmount,
              payment_method: formData.paymentMethod,
              payment_ref: formData.paymentRef || null,
              notes: paymentNotes,
              created_by: auth.user.id,
            });

          if (paymentError) throw paymentError;
        }
      }

      router.push(`/tender/${params.tenderId}/purchases`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Link
            href={`/tender/${params.tenderId}/purchases`}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to purchases
          </Link>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-blue-50 to-slate-50">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Plus className="h-6 w-6 text-blue-600" />
              Add New Purchase
            </CardTitle>
            <p className="text-sm text-slate-600 mt-2">
              Record a new material or vendor purchase
            </p>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              {/* Purchase Type Selection */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Purchase Type</Label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setPurchaseType("material")}
                    className={`flex-1 px-6 py-4 rounded-lg border-2 transition-all ${
                      purchaseType === "material"
                        ? "border-blue-600 bg-blue-50 text-blue-900"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="font-semibold mb-1">Material Purchase</div>
                    <div className="text-xs text-slate-600">
                      Sand, cement, bricks, etc.
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPurchaseType("vendor")}
                    className={`flex-1 px-6 py-4 rounded-lg border-2 transition-all ${
                      purchaseType === "vendor"
                        ? "border-blue-600 bg-blue-50 text-blue-900"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="font-semibold mb-1">Vendor Item</div>
                    <div className="text-xs text-slate-600">
                      Other purchases from vendors
                    </div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date */}
                <div>
                  <Label htmlFor="purchaseDate">Purchase Date *</Label>
                  <Input
                    id="purchaseDate"
                    name="purchaseDate"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Vendor Selection */}
                <div>
                  <Label className="flex items-center justify-between">
                    <span>Vendor *</span>
                    <button
                      type="button"
                      onClick={() => setIsNewVendor(!isNewVendor)}
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <User className="h-3 w-3" />
                      {isNewVendor ? "Select Existing" : "Add New"}
                    </button>
                  </Label>
                  {isNewVendor ? (
                    <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <Input
                        name="newVendorName"
                        placeholder="Vendor Name *"
                        value={formData.newVendorName}
                        onChange={handleChange}
                        required
                      />
                      <Input
                        name="newVendorPhone"
                        placeholder="Phone (optional)"
                        value={formData.newVendorPhone}
                        onChange={handleChange}
                      />
                      <div>
                        <Label className="text-xs mb-2 block">
                          Categories (select multiple)
                        </Label>
                        <div className="bg-white border rounded-md p-3 max-h-40 overflow-y-auto">
                          <div className="grid grid-cols-2 gap-2">
                            {categories.map((c) => (
                              <label
                                key={c.id}
                                className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1.5 rounded text-sm"
                              >
                                <input
                                  type="checkbox"
                                  checked={formData.newVendorCategoryIds.includes(
                                    c.id
                                  )}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFormData((p) => ({
                                        ...p,
                                        newVendorCategoryIds: [
                                          ...p.newVendorCategoryIds,
                                          c.id,
                                        ],
                                      }));
                                    } else {
                                      setFormData((p) => ({
                                        ...p,
                                        newVendorCategoryIds:
                                          p.newVendorCategoryIds.filter(
                                            (id) => id !== c.id
                                          ),
                                      }));
                                    }
                                  }}
                                  className="rounded"
                                />
                                <span>{c.name_bn || c.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <select
                      id="vendorId"
                      name="vendorId"
                      value={formData.vendorId}
                      onChange={handleChange}
                      required={!isNewVendor}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="">Select vendor...</option>
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} {v.phone ? `(${v.phone})` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Item Details */}
              {purchaseType === "material" && (
                <div>
                  <Label htmlFor="materialId">Material</Label>
                  <select
                    id="materialId"
                    name="materialId"
                    value={formData.materialId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">
                      Select material or enter custom below
                    </option>
                    {materials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name_bn}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(!formData.materialId || purchaseType === "vendor") && (
                <div className="space-y-2">
                  <Label htmlFor="customItemName">
                    {purchaseType === "material"
                      ? "Custom Item Name"
                      : "Item Name *"}
                  </Label>

                  {/* Show vendor products dropdown if vendor is selected */}
                  {purchaseType === "vendor" && vendorProducts.length > 0 && (
                    <select
                      value=""
                      onChange={(e) => {
                        const selectedProduct = vendorProducts.find(
                          (p) => p.item_name === e.target.value
                        );
                        if (selectedProduct) {
                          setFormData((prev) => ({
                            ...prev,
                            customItemName: selectedProduct.item_name,
                            unit: selectedProduct.unit || prev.unit,
                            unitRate:
                              selectedProduct.last_unit_price?.toString() ||
                              prev.unitRate,
                          }));
                        }
                      }}
                      className="w-full px-3 py-2 border rounded-md bg-white mb-2"
                    >
                      <option value="">Select from vendor products...</option>
                      {vendorProducts.map((p, idx) => (
                        <option key={idx} value={p.item_name}>
                          {p.item_name}{" "}
                          {p.materials?.name_bn && `(${p.materials.name_bn})`} -
                          ৳{p.last_unit_price}/{p.unit}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Show recent items if vendor is selected and has history */}
                  {purchaseType === "vendor" && recentItems.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-gray-600 mb-1">
                        Recent purchases:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {recentItems.map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                customItemName: item.item_name,
                                unit: item.unit || prev.unit,
                                unitRate:
                                  item.unit_price?.toString() || prev.unitRate,
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
                    id="customItemName"
                    name="customItemName"
                    value={formData.customItemName}
                    onChange={handleChange}
                    placeholder="Or type custom item name"
                    required={purchaseType === "vendor" || !formData.materialId}
                  />
                </div>
              )}

              {/* Quantity and Unit */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="unit">Unit *</Label>
                  <Input
                    id="unit"
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    required
                    placeholder="kg, bag, cft"
                  />
                </div>
                <div>
                  <Label htmlFor="unitRate">Unit Rate *</Label>
                  <Input
                    id="unitRate"
                    name="unitRate"
                    type="number"
                    step="0.01"
                    value={formData.unitRate}
                    onChange={handleChange}
                    required
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Additional Costs */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  Additional Costs (Optional)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="transportCost">Transportation Cost</Label>
                    <Input
                      id="transportCost"
                      name="transportCost"
                      type="number"
                      step="0.01"
                      value={formData.transportCost}
                      onChange={handleChange}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="unloadCost">Unload Cost</Label>
                    <Input
                      id="unloadCost"
                      name="unloadCost"
                      type="number"
                      step="0.01"
                      value={formData.unloadCost}
                      onChange={handleChange}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Total Amount */}
              <div>
                <Label htmlFor="totalAmount">Total Amount *</Label>
                <Input
                  id="totalAmount"
                  name="totalAmount"
                  type="number"
                  step="0.01"
                  value={formData.totalAmount}
                  onChange={handleChange}
                  required
                  className="text-lg font-semibold text-blue-600"
                  placeholder="0.00"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Base amount + transportation + unload costs
                </p>
              </div>

              {/* Payment Method */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        paymentMethod: value as "cash" | "bank" | "due" | "mfs",
                        mfsCharge: value === "mfs" ? prev.mfsCharge : false,
                      }));
                    }}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="mfs">MFS (bKash, Nagad)</option>
                    <option value="due">Due/Credit</option>
                  </select>
                  {formData.paymentMethod === "mfs" && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="mfsCharge"
                            checked={formData.mfsCharge}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                mfsCharge: e.target.checked,
                              }))
                            }
                            className="rounded"
                          />
                          <label
                            htmlFor="mfsCharge"
                            className="text-sm text-slate-700"
                          >
                            Add MFS charge to total (1.85% + ৳10)
                          </label>
                        </div>
                        {formData.mfsCharge && formData.totalAmount && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
                            <div className="flex justify-between mb-1">
                              <span className="text-slate-600">
                                Base Amount:
                              </span>
                              <span className="font-medium">
                                ৳{parseFloat(formData.totalAmount).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between mb-1">
                              <span className="text-slate-600">
                                MFS Charge (1.85%):
                              </span>
                              <span className="font-medium">
                                ৳
                                {(
                                  parseFloat(formData.totalAmount) * 0.0185
                                ).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between mb-1">
                              <span className="text-slate-600">
                                Transaction Fee:
                              </span>
                              <span className="font-medium">৳10.00</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-yellow-300">
                              <span className="font-semibold text-slate-800">
                                Final Total:
                              </span>
                              <span className="font-bold text-lg text-green-700">
                                ৳
                                {(
                                  parseFloat(formData.totalAmount) * 1.0185 +
                                  10
                                ).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                </div>
                <div>
                  <Label htmlFor="paymentRef">Payment Reference</Label>
                  <Input
                    id="paymentRef"
                    name="paymentRef"
                    value={formData.paymentRef}
                    onChange={handleChange}
                    placeholder="Check no, TxID, etc."
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Additional notes..."
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? "Saving..." : "Save Purchase"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
