"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { labels } from "@/lib/utils/bangla";

export default function AddMaterialPage({
  params,
}: {
  params: { tenderId: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isBulk, setIsBulk] = useState(false);
  const [materials, setMaterials] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [personKey, setPersonKey] = useState("");
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [newVendorName, setNewVendorName] = useState("");
  const [newVendorPhone, setNewVendorPhone] = useState("");

  const [formData, setFormData] = useState({
    purchaseDate: new Date().toISOString().split("T")[0],
    materialId: "",
    customItemName: "",
    unit: "",
    quantity: "",
    unitRate: "",
    totalAmount: "",
    baseRatePerCft: "",
    qtyCft: "",
    transportVaraCost: "",
    unloadRatePerCft: "",
    baseCost: "",
    unloadCost: "",
    supplier: "",
    vendorId: "",
    paymentMethod: "cash",
    paymentRef: "",
    personId: "",
    personType: "",
    notes: "",
  });

  useEffect(() => {
    loadMaterials();
    loadPeople();
    loadVendors();
  }, []);

  const loadMaterials = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("materials")
      .select("*")
      .eq("is_active", true)
      .order("name_bn");

    if (data) setMaterials(data);
  };

  const loadVendors = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("vendors")
      .select("id, name, phone")
      .eq("tender_id", params.tenderId)
      .order("name");

    if (data) setVendors(data);
  };

  const loadPeople = async () => {
    const supabase = createClient();

    const { data: authAssignments } = await supabase
      .from("tender_assignments")
      .select(
        `
        user_id,
        role,
        profiles (id, full_name)
      `
      )
      .eq("tender_id", params.tenderId)
      .not("user_id", "is", null);

    const { data: personAssignments } = await supabase
      .from("tender_assignments")
      .select(
        `
        person_id,
        role,
        persons (id, full_name)
      `
      )
      .eq("tender_id", params.tenderId)
      .not("person_id", "is", null);

    const list: any[] = [];

    if (authAssignments) {
      authAssignments.forEach((ta: any) => {
        if (ta.profiles) {
          list.push({
            id: ta.profiles.id,
            name: ta.profiles.full_name,
            role: ta.role,
            type: "user",
          });
        }
      });
    }

    if (personAssignments) {
      personAssignments.forEach((ta: any) => {
        if (ta.persons) {
          list.push({
            id: ta.persons.id,
            name: ta.persons.full_name,
            role: ta.role,
            type: "person",
          });
        }
      });
    }

    setPeople(list);
  };

  const handleVendorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vendorId = e.target.value;
    setFormData((prev) => ({ ...prev, vendorId }));
    
    if (vendorId) {
      const vendor = vendors.find((v) => v.id === vendorId);
      if (vendor) {
        setFormData((prev) => ({ ...prev, supplier: vendor.name }));
      }
    } else {
      setFormData((prev) => ({ ...prev, supplier: "" }));
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (!isBulk) {
      if (name === "quantity" || name === "unitRate") {
        const qty =
          name === "quantity"
            ? parseFloat(value)
            : parseFloat(formData.quantity);
        const rate =
          name === "unitRate"
            ? parseFloat(value)
            : parseFloat(formData.unitRate);

        if (qty && rate) {
          setFormData((prev) => ({
            ...prev,
            [name]: value,
            totalAmount: (qty * rate).toFixed(2),
          }));
        } else {
          setFormData((prev) => ({ ...prev, [name]: value }));
        }
      }
    }

    if (isBulk) {
      if (
        name === "qtyCft" ||
        name === "baseRatePerCft" ||
        name === "transportVaraCost" ||
        name === "unloadRatePerCft"
      ) {
        const qty =
          name === "qtyCft" ? parseFloat(value) : parseFloat(formData.qtyCft);
        const baseRate =
          name === "baseRatePerCft"
            ? parseFloat(value)
            : parseFloat(formData.baseRatePerCft);
        const transport =
          name === "transportVaraCost"
            ? parseFloat(value)
            : parseFloat(formData.transportVaraCost);
        const unloadRate =
          name === "unloadRatePerCft"
            ? parseFloat(value)
            : parseFloat(formData.unloadRatePerCft);

        if (qty && baseRate) {
          const baseCost = qty * baseRate;
          const unloadCost = qty * (unloadRate || 0);
          const total = baseCost + (transport || 0) + unloadCost;

          setFormData((prev) => ({
            ...prev,
            [name]: value,
            baseCost: baseCost.toFixed(2),
            unloadCost: unloadCost.toFixed(2),
            totalAmount: total.toFixed(2),
          }));
        } else {
          setFormData((prev) => ({ ...prev, [name]: value }));
        }
      }
    }

    if (name === "materialId") {
      const material = materials.find((m) => m.id === value);
      if (material) {
        setFormData((prev) => ({
          ...prev,
          materialId: value,
          unit: material.unit,
        }));
      }
    }

    if (name === "paymentMethod" && value !== "advance") {
      setPersonKey("");
      setFormData((prev) => ({ ...prev, personId: "", personType: "" }));
    }
  };

  const handlePersonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setPersonKey(value);

    if (!value) {
      setFormData((prev) => ({ ...prev, personId: "", personType: "" }));
      return;
    }

    const [personType, personId] = value.split(":");
    setFormData((prev) => ({ ...prev, personId, personType }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Please sign in first.");
        setLoading(false);
        return;
      }

      if (formData.paymentMethod === "advance" && !formData.personId) {
        setError("Select a person when paying from advance.");
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase
        .from("material_purchases")
        .insert({
          tender_id: params.tenderId,
          purchase_date: formData.purchaseDate,
          material_id: formData.materialId || null,
          custom_item_name: formData.customItemName || null,
          unit: formData.unit || null,
          quantity: formData.quantity ? parseFloat(formData.quantity) : null,
          unit_rate: formData.unitRate ? parseFloat(formData.unitRate) : null,
          total_amount: parseFloat(formData.totalAmount),
          is_bulk_breakdown: isBulk,
          base_rate_per_cft:
            isBulk && formData.baseRatePerCft
              ? parseFloat(formData.baseRatePerCft)
              : null,
          qty_cft:
            isBulk && formData.qtyCft ? parseFloat(formData.qtyCft) : null,
          transport_vara_cost:
            isBulk && formData.transportVaraCost
              ? parseFloat(formData.transportVaraCost)
              : null,
          unload_rate_per_cft:
            isBulk && formData.unloadRatePerCft
              ? parseFloat(formData.unloadRatePerCft)
              : null,
          base_cost:
            isBulk && formData.baseCost ? parseFloat(formData.baseCost) : null,
          unload_cost:
            isBulk && formData.unloadCost ? parseFloat(formData.unloadCost) : null,
          supplier: formData.supplier || null,
          vendor_id: formData.vendorId || null,
          payment_method: formData.paymentMethod as any,
          payment_ref: formData.paymentRef || null,
          notes: formData.notes || null,
          created_by: user.id,
        });

      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }

      if (formData.paymentMethod === "advance") {
        const isAuthUser = formData.personType === "user";
        const materialName = formData.materialId
          ? materials.find((m) => m.id === formData.materialId)?.name_bn
          : formData.customItemName;
        const expenseDescription = materialName
          ? `Material: ${materialName}`
          : "Material purchase";

        const { error: expenseError } = await supabase
          .from("expense_submissions")
          .insert({
            tender_id: params.tenderId,
            expense_date: formData.purchaseDate,
            category_id: null,
            subcategory_id: null,
            description: expenseDescription,
            amount: parseFloat(formData.totalAmount),
            notes: formData.notes || null,
            submitted_by: isAuthUser ? formData.personId : user.id,
            person_id: !isAuthUser ? formData.personId : null,
            status: "approved",
            approved_by: user.id,
            approved_at: new Date().toISOString(),
          });

        if (expenseError) {
          setError(expenseError.message);
          setLoading(false);
          return;
        }
      }

      router.push(`/tender/${params.tenderId}/materials`);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-6">
          <Link
            href={`/tender/${params.tenderId}`}
            className="text-blue-600 hover:text-blue-800"
          >
            Back to tender dashboard
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add material purchase</CardTitle>
            <p className="text-sm text-gray-600">
              Track regular material purchases or bulk breakdown items like
              sand/stone.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-2 border-b">
                <button
                  type="button"
                  onClick={() => setIsBulk(false)}
                  className={`px-4 py-2 font-medium ${
                    !isBulk
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-600"
                  }`}
                >
                  Regular
                </button>
                <button
                  type="button"
                  onClick={() => setIsBulk(true)}
                  className={`px-4 py-2 font-medium ${
                    isBulk
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-600"
                  }`}
                >
                  Bulk breakdown
                </button>
              </div>

              <div>
                <Label htmlFor="purchaseDate">{labels.date} *</Label>
                <Input
                  id="purchaseDate"
                  name="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="materialId">{labels.item}</Label>
                <select
                  id="materialId"
                  name="materialId"
                  value={formData.materialId}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  disabled={loading}
                >
                  <option value="">Select material</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name_bn}
                    </option>
                  ))}
                </select>
              </div>

              {!formData.materialId && (
                <div>
                  <Label htmlFor="customItemName">Custom item name</Label>
                  <Input
                    id="customItemName"
                    name="customItemName"
                    value={formData.customItemName}
                    onChange={handleChange}
                    placeholder="Enter item name"
                    disabled={loading}
                  />
                </div>
              )}

              {!isBulk ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quantity">{labels.quantity} *</Label>
                      <Input
                        id="quantity"
                        name="quantity"
                        type="number"
                        step="0.001"
                        value={formData.quantity}
                        onChange={handleChange}
                        required={!isBulk}
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <Label htmlFor="unit">{labels.unit} *</Label>
                      <Input
                        id="unit"
                        name="unit"
                        value={formData.unit}
                        onChange={handleChange}
                        required={!isBulk}
                        placeholder="Unit"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="unitRate">{labels.rate} *</Label>
                      <Input
                        id="unitRate"
                        name="unitRate"
                        type="number"
                        step="0.01"
                        value={formData.unitRate}
                        onChange={handleChange}
                        required={!isBulk}
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <Label htmlFor="totalAmount">{labels.total} *</Label>
                      <Input
                        id="totalAmount"
                        name="totalAmount"
                        type="number"
                        step="0.01"
                        value={formData.totalAmount}
                        onChange={handleChange}
                        required={!isBulk}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="qtyCft">Quantity (cft) *</Label>
                      <Input
                        id="qtyCft"
                        name="qtyCft"
                        type="number"
                        step="0.001"
                        value={formData.qtyCft}
                        onChange={handleChange}
                        required={isBulk}
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <Label htmlFor="baseRatePerCft">Base rate (per cft) *</Label>
                      <Input
                        id="baseRatePerCft"
                        name="baseRatePerCft"
                        type="number"
                        step="0.01"
                        value={formData.baseRatePerCft}
                        onChange={handleChange}
                        required={isBulk}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="transportVaraCost">{labels.transportCost}</Label>
                    <Input
                      id="transportVaraCost"
                      name="transportVaraCost"
                      type="number"
                      step="0.01"
                      value={formData.transportVaraCost}
                      onChange={handleChange}
                      placeholder="Transport cost"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="unloadRatePerCft">
                      Unload rate (per cft)
                    </Label>
                    <Input
                      id="unloadRatePerCft"
                      name="unloadRatePerCft"
                      type="number"
                      step="0.01"
                      value={formData.unloadRatePerCft}
                      onChange={handleChange}
                      placeholder="Unload rate"
                      disabled={loading}
                    />
                  </div>

                  {formData.baseCost && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                      <h4 className="font-semibold">Breakdown</h4>
                      <div className="space-y-1 text-sm">
                        <p>Base cost: {formData.baseCost}</p>
                        {formData.transportVaraCost && (
                          <p>Transport: {formData.transportVaraCost}</p>
                        )}
                        {formData.unloadCost && (
                          <p>Unload: {formData.unloadCost}</p>
                        )}
                        <p className="font-bold pt-2 border-t">
                          Total: {formData.totalAmount}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div>
                <Label htmlFor="vendorId">{labels.vendor}</Label>
                <select
                  id="vendorId"
                  name="vendorId"
                  value={formData.vendorId}
                  onChange={handleVendorChange}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  disabled={loading}
                >
                  <option value="">Select vendor or enter below</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} {v.phone ? `(${v.phone})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="supplier">{labels.supplier}</Label>
                <Input
                  id="supplier"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleChange}
                  placeholder="Enter supplier name manually"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Select vendor above or enter supplier name manually
                </p>
              </div>

              <div>
                <Label htmlFor="paymentMethod">{labels.paymentMethod}</Label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  disabled={loading}
                >
                  <option value="cash">{labels.cash}</option>
                  <option value="bank">{labels.bank}</option>
                  <option value="mfs">{labels.mfs}</option>
                  <option value="advance">{labels.advance}</option>
                </select>
              </div>

              {formData.paymentMethod === "advance" && (
                <div>
                  <Label htmlFor="personKey">Advance person *</Label>
                  <select
                    id="personKey"
                    name="personKey"
                    value={personKey}
                    onChange={handlePersonChange}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    required
                    disabled={loading}
                  >
                    <option value="">Select person</option>
                    {people.map((p) => (
                      <option key={`${p.type}:${p.id}`} value={`${p.type}:${p.id}`}>
                        {p.name} ({p.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <Label htmlFor="paymentRef">Payment reference</Label>
                <Input
                  id="paymentRef"
                  name="paymentRef"
                  value={formData.paymentRef}
                  onChange={handleChange}
                  placeholder="Reference (optional)"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="notes">{labels.notes}</Label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  disabled={loading}
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? labels.loading : labels.save}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  {labels.cancel}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
