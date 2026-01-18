"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EditMaterialPurchasePage({
  params,
}: {
  params: { tenderId: string; purchaseId: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [vendors, setVendors] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);

  const [materialId, setMaterialId] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [customItemName, setCustomItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [supplier, setSupplier] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadPurchase();
    loadVendors();
    loadMaterials();
  }, []);

  const loadPurchase = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("material_purchases")
        .select("*, materials(name_bn, unit_bn)")
        .eq("id", params.purchaseId)
        .single();

      if (error) throw error;

      if (data) {
        setMaterialId(data.material_id || "");
        setPurchaseDate(data.purchase_date);
        setCustomItemName(data.custom_item_name || "");
        setQuantity(data.quantity?.toString() || "");
        setUnit(data.unit || "");
        setSupplier(data.supplier || "");
        setVendorId(data.vendor_id || "");
        setTotalAmount(data.total_amount?.toString() || "");
        setNotes(data.notes || "");
      }
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const loadVendors = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("vendors")
      .select("id, name, phone")
      .eq("tender_id", params.tenderId)
      .eq("is_active", true)
      .order("name");

    if (data) setVendors(data);
  };

  const loadMaterials = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("materials")
      .select("id, name_bn, unit_bn")
      .eq("is_active", true)
      .order("name_bn");

    if (data) setMaterials(data);
  };

  const handleVendorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedVendorId = e.target.value;
    setVendorId(selectedVendorId);
    
    if (selectedVendorId) {
      const vendor = vendors.find((v) => v.id === selectedVendorId);
      if (vendor) {
        setSupplier(vendor.name);
      }
    } else {
      setSupplier("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const supabase = createClient();

      const newAmount = Number(parseFloat(totalAmount).toFixed(2));

      // Update the purchase
      const { error } = await supabase
        .from("material_purchases")
        .update({
          purchase_date: purchaseDate,
          material_id: materialId || null,
          custom_item_name: customItemName || null,
          quantity: Number(parseFloat(quantity).toFixed(3)),
          unit: unit,
          supplier: supplier || null,
          vendor_id: vendorId || null,
          total_amount: newAmount,
          notes: notes || null,
        })
        .eq("id", params.purchaseId);

      if (error) throw error;

      // If vendor is associated, update any auto-generated payment
      if (vendorId) {
        const { data: relatedPayments } = await supabase
          .from("vendor_payments")
          .select("id, notes")
          .eq("vendor_id", vendorId);

        // Find payment that references this purchase
        const matchingPayment = relatedPayments?.find(p => 
          p.notes?.toLowerCase().includes(`purchase ${params.purchaseId}`)
        );

        if (matchingPayment) {
          // Update the payment amount to match new purchase amount
          await supabase
            .from("vendor_payments")
            .update({
              amount: newAmount,
              payment_date: purchaseDate,
            })
            .eq("id", matchingPayment.id);
        }
      }

      router.push(`/tender/${params.tenderId}/purchases`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-6">
          <Link
            href={`/tender/${params.tenderId}/materials`}
            className="text-blue-600 hover:text-blue-800"
          >
            ← মালামাল রেজিস্টার
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>মালামাল ক্রয় সম্পাদনা</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-100 border border-red-300 rounded p-3">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div>
                <Label>তারিখ *</Label>
                <Input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label>মালামাল নির্বাচন করুন</Label>
                <select
                  value={materialId}
                  onChange={(e) => {
                    const selectedMaterialId = e.target.value;
                    setMaterialId(selectedMaterialId);
                    
                    if (selectedMaterialId) {
                      const material = materials.find((m) => m.id === selectedMaterialId);
                      if (material) {
                        setCustomItemName("");
                        setUnit(material.unit_bn || "");
                      }
                    }
                  }}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  disabled={saving}
                >
                  <option value="">মালামাল নির্বাচন করুন বা নিচে কাস্টম নাম লিখুন</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name_bn}
                    </option>
                  ))}
                </select>
              </div>

              {!materialId && (
                <div>
                  <Label>কাস্টম মালামালের নাম *</Label>
                  <Input
                    value={customItemName}
                    onChange={(e) => setCustomItemName(e.target.value)}
                    placeholder="যেমন: সিমেন্ট, বালু, রড"
                    required={!materialId}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    উপরে তালিকা থেকে নির্বাচন করুন বা এখানে কাস্টম নাম লিখুন
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>পরিমাণ *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="০"
                    required
                  />
                </div>
                <div>
                  <Label>একক *</Label>
                  <Input
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="যেমন: বস্তা, CFT"
                    required
                  />
                </div>
              </div>

              <div>
                <Label>বিক্রেতা</Label>
                <select
                  value={vendorId}
                  onChange={handleVendorChange}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  disabled={saving}
                >
                  <option value="">বিক্রেতা নির্বাচন করুন বা নিচে লিখুন</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} {v.phone ? `(${v.phone})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>সরবরাহকারী</Label>
                <Input
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="ম্যানুয়ালি সরবরাহকারীর নাম লিখুন"
                />
                <p className="text-xs text-gray-500 mt-1">
                  উপরে বিক্রেতা নির্বাচন করুন বা ম্যানুয়ালি নাম লিখুন
                </p>
              </div>

              <div>
                <Label>মোট টাকা *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="০"
                  required
                />
              </div>

              <div>
                <Label>নোট</Label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="অতিরিক্ত তথ্য..."
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? "সংরক্ষণ করছি..." : "সংরক্ষণ করুন"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={saving}
                >
                  বাতিল
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
