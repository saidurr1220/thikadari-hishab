"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Save,
  X,
  Calendar,
  FileText,
  Hash,
  DollarSign,
  User,
  FileEdit,
} from "lucide-react";

export default function EditActivityExpensePage({
  params,
}: {
  params: { tenderId: string; activityId: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [activityDate, setActivityDate] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [rate, setRate] = useState("");
  const [amount, setAmount] = useState("");
  const [vendor, setVendor] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadActivity();
  }, []);

  const loadActivity = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("activity_expenses")
        .select("*")
        .eq("id", params.activityId)
        .single();

      if (error) throw error;

      if (data) {
        setActivityDate(data.expense_date);
        setDescription(data.description || "");
        setQuantity(data.quantity?.toString() || "");
        setUnit(data.unit || "");
        setRate(data.rate?.toString() || "");
        setAmount(data.amount?.toString() || "");
        setVendor(data.vendor || "");
        setNotes(data.notes || "");
      }
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("activity_expenses")
        .update({
          expense_date: activityDate,
          description: description,
          quantity: quantity ? parseFloat(quantity) : null,
          unit: unit || null,
          rate: rate ? parseFloat(rate) : null,
          amount: parseFloat(amount),
          vendor: vendor || null,
          notes: notes || null,
        })
        .eq("id", params.activityId);

      if (error) throw error;

      router.push(`/tender/${params.tenderId}/activities`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/tender/${params.tenderId}/activities`}
            className="inline-flex items-center gap-2 text-amber-700 hover:text-amber-900 font-medium transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            সইট খরচ ফর যন
          </Link>
        </div>

        {/* Main Card */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 sm:p-8">
            <div className="flex items-center gap-3 text-white">
              <div className="p-2 bg-white/20 rounded-lg">
                <FileEdit className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">
                  খরচ সমপদন করন
                </h1>
                <p className="text-amber-50 text-sm mt-1">
                  সইট খরচর তথয আপডট করন
                </p>
              </div>
            </div>
          </div>
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                  <p className="text-red-800 text-sm font-medium flex items-center gap-2">
                    <X className="w-4 h-4" />
                    {error}
                  </p>
                </div>
              )}

              {/* Date Field */}
              <div>
                <Label className="text-gray-700 font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  তরখ <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={activityDate}
                  onChange={(e) => setActivityDate(e.target.value)}
                  required
                  className="mt-1.5 border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>

              {/* Description Field */}
              <div>
                <Label className="text-gray-700 font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-600" />
                  ববরণ <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="খরচর ববরণ লখন"
                  required
                  className="mt-1.5 border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>

              {/* Quantity, Unit, Rate Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label className="text-gray-700 font-medium flex items-center gap-2">
                    <Hash className="w-4 h-4 text-amber-600" />
                    পরমণ
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder=""
                    className="mt-1.5 border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-600" />
                    একক
                  </Label>
                  <Input
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="যমন: দন, ঘণট"
                    className="mt-1.5 border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 font-medium flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-amber-600" />
                    রট
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    placeholder=""
                    className="mt-1.5 border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Amount Field */}
              <div>
                <Label className="text-gray-700 font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-600" />
                  মট টক <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder=""
                  required
                  className="mt-1.5 border-gray-300 focus:border-amber-500 focus:ring-amber-500 text-lg font-semibold"
                />
              </div>

              {/* Vendor Field */}
              <div>
                <Label className="text-gray-700 font-medium flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-600" />
                  বকরত
                </Label>
                <Input
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  placeholder="বকরতর নম"
                  className="mt-1.5 border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>

              {/* Notes Field */}
              <div>
                <Label className="text-gray-700 font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-600" />
                  নট
                </Label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1.5 w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  rows={4}
                  placeholder="অতরকত তথয লখন..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-6 text-base shadow-lg hover:shadow-xl transition-all"
                >
                  <Save className="w-5 h-5 mr-2" />
                  {saving ? "সরকষণ করছ..." : "সরকষণ করন"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={saving}
                  className="flex-1 sm:flex-none border-2 border-gray-300 hover:bg-gray-50 font-semibold py-6 text-base"
                >
                  <X className="w-5 h-5 mr-2" />
                  বতল
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
