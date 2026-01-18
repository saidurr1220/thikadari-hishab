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
  Plus,
  Receipt,
  Layers,
} from "lucide-react";
import { labels } from "@/lib/utils/bangla";

export default function AddActivityPage({
  params,
}: {
  params: { tenderId: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [showMiniBOQ, setShowMiniBOQ] = useState(false);
  const [people, setPeople] = useState<any[]>([]);
  const [personKey, setPersonKey] = useState("");

  const [formData, setFormData] = useState({
    activityDate: new Date().toISOString().split("T")[0],
    categoryId: "",
    subcategoryId: "",
    description: "",
    quantity: "",
    unit: "",
    rate: "",
    amount: "",
    vendor: "",
    paymentMethod: "cash",
    paymentRef: "",
    personId: "",
    personType: "",
    notes: "",
  });

  useEffect(() => {
    loadCategories();
    loadPeople();
  }, []);

  const loadCategories = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("activity_categories")
      .select("*")
      .eq("is_active", true)
      .is("parent_id", null)
      .order("name_bn");

    if (data) setCategories(data);
  };

  const loadSubcategories = async (categoryId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("activity_categories")
      .select("*")
      .eq("parent_id", categoryId)
      .eq("is_active", true)
      .order("name_bn");

    if (data) setSubcategories(data);
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

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "categoryId") {
      loadSubcategories(value);
      setFormData((prev) => ({
        ...prev,
        categoryId: value,
        subcategoryId: "",
      }));
    }

    if (name === "quantity" || name === "rate") {
      const qty =
        name === "quantity" ? parseFloat(value) : parseFloat(formData.quantity);
      const rate =
        name === "rate" ? parseFloat(value) : parseFloat(formData.rate);

      if (qty && rate) {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
          amount: (qty * rate).toFixed(2),
        }));
      } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
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

      if (!formData.amount) {
        setError("Enter a valid amount.");
        setLoading(false);
        return;
      }

      if (formData.paymentMethod === "advance" && !formData.personId) {
        setError("Select a person when paying from advance.");
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase
        .from("activity_expenses")
        .insert({
          tender_id: params.tenderId,
          expense_date: formData.activityDate,
          category_id: formData.categoryId,
          subcategory_id: formData.subcategoryId || null,
          description: formData.description,
          quantity: formData.quantity ? parseFloat(formData.quantity) : null,
          unit: formData.unit || null,
          rate: formData.rate ? parseFloat(formData.rate) : null,
          amount: parseFloat(formData.amount),
          vendor: formData.vendor || null,
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
        const { error: expenseError } = await supabase
          .from("expense_submissions")
          .insert({
            tender_id: params.tenderId,
            expense_date: formData.activityDate,
            category_id: formData.categoryId,
            subcategory_id: formData.subcategoryId || null,
            description: formData.description,
            amount: parseFloat(formData.amount),
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

      router.push(`/tender/${params.tenderId}/activities`);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

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
            সাইট খরচে ফিরে যান
          </Link>
        </div>

        {/* Main Card */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 sm:p-8">
            <div className="flex items-center gap-3 text-white">
              <div className="p-2 bg-white/20 rounded-lg">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">
                  নতুন খরচ যোগ করুন
                </h1>
                <p className="text-amber-50 text-sm mt-1">
                  দৈনিক সাইট খরচ এবং কাস্টম খরচ রেকর্ড করুন
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
                <Label
                  htmlFor="activityDate"
                  className="text-gray-700 font-medium flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4 text-amber-600" />
                  {labels.date} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="activityDate"
                  name="activityDate"
                  type="date"
                  value={formData.activityDate}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="mt-1.5 border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>

              {/* Category */}
              <div>
                <Label
                  htmlFor="categoryId"
                  className="text-gray-700 font-medium flex items-center gap-2"
                >
                  <Layers className="w-4 h-4 text-amber-600" />
                  {labels.category} <span className="text-red-500">*</span>
                </Label>
                <select
                  id="categoryId"
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  className="mt-1.5 flex h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  required
                  disabled={loading}
                >
                  <option value="">ক্যাটাগরি নির্বাচন করুন</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name_bn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subcategory */}
              {formData.categoryId && subcategories.length > 0 && (
                <div>
                  <Label
                    htmlFor="subcategoryId"
                    className="text-gray-700 font-medium flex items-center gap-2"
                  >
                    <Layers className="w-4 h-4 text-amber-600" />
                    {labels.subcategory}
                  </Label>
                  <select
                    id="subcategoryId"
                    name="subcategoryId"
                    value={formData.subcategoryId}
                    onChange={handleChange}
                    className="mt-1.5 flex h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                    disabled={loading}
                  >
                    <option value="">সাব-ক্যাটাগরি নির্বাচন করুন</option>
                    {subcategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name_bn}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Description */}
              <div>
                <Label
                  htmlFor="description"
                  className="text-gray-700 font-medium flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-amber-600" />
                  {labels.description} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="খরচের বিবরণ লিখুন"
                  required
                  disabled={loading}
                  className="mt-1.5 border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>

              {/* Mini BOQ Toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowMiniBOQ(!showMiniBOQ)}
                  className="inline-flex items-center gap-2 text-sm font-medium text-amber-700 hover:text-amber-900 transition-colors"
                >
                  <Receipt className="w-4 h-4" />
                  {showMiniBOQ ? "মিনি BOQ লুকান" : "মিনি BOQ যোগ করুন"}
                </button>
              </div>

              {/* Mini BOQ Section */}
              {showMiniBOQ && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-lg p-5 space-y-4">
                  <h3 className="font-semibold text-amber-900 flex items-center gap-2">
                    <Receipt className="w-5 h-5" />
                    পরিমাণ ও রেট
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label
                        htmlFor="quantity"
                        className="text-gray-700 font-medium flex items-center gap-2"
                      >
                        <Hash className="w-4 h-4 text-amber-600" />
                        {labels.quantity}
                      </Label>
                      <Input
                        id="quantity"
                        name="quantity"
                        type="number"
                        step="0.001"
                        value={formData.quantity}
                        onChange={handleChange}
                        disabled={loading}
                        placeholder=""
                        className="mt-1.5 border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="unit"
                        className="text-gray-700 font-medium flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4 text-amber-600" />
                        {labels.unit}
                      </Label>
                      <Input
                        id="unit"
                        name="unit"
                        value={formData.unit}
                        onChange={handleChange}
                        placeholder="যেমন: দিন, ঘণ্টা"
                        disabled={loading}
                        className="mt-1.5 border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="rate"
                        className="text-gray-700 font-medium flex items-center gap-2"
                      >
                        <DollarSign className="w-4 h-4 text-amber-600" />
                        {labels.rate}
                      </Label>
                      <Input
                        id="rate"
                        name="rate"
                        type="number"
                        step="0.01"
                        value={formData.rate}
                        onChange={handleChange}
                        disabled={loading}
                        placeholder=""
                        className="mt-1.5 border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Amount */}
              <div>
                <Label
                  htmlFor="amount"
                  className="text-gray-700 font-medium flex items-center gap-2"
                >
                  <DollarSign className="w-4 h-4 text-amber-600" />
                  {labels.amount} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder=""
                  className="mt-1.5 border-gray-300 focus:border-amber-500 focus:ring-amber-500 text-lg font-semibold"
                />
              </div>

              {/* Vendor */}
              <div>
                <Label
                  htmlFor="vendor"
                  className="text-gray-700 font-medium flex items-center gap-2"
                >
                  <User className="w-4 h-4 text-amber-600" />
                  {labels.vendor}
                </Label>
                <Input
                  id="vendor"
                  name="vendor"
                  value={formData.vendor}
                  onChange={handleChange}
                  placeholder="বিক্রেতার নাম (ঐচ্ছিক)"
                  disabled={loading}
                  className="mt-1.5 border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>

              {/* Payment Method */}
              <div>
                <Label
                  htmlFor="paymentMethod"
                  className="text-gray-700 font-medium flex items-center gap-2"
                >
                  <DollarSign className="w-4 h-4 text-amber-600" />
                  {labels.paymentMethod}
                </Label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  className="mt-1.5 flex h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  disabled={loading}
                >
                  <option value="cash">{labels.cash}</option>
                  <option value="bank">{labels.bank}</option>
                  <option value="mfs">{labels.mfs}</option>
                  <option value="advance">{labels.advance}</option>
                </select>
              </div>

              {/* Advance Person */}
              {formData.paymentMethod === "advance" && (
                <div>
                  <Label
                    htmlFor="personKey"
                    className="text-gray-700 font-medium flex items-center gap-2"
                  >
                    <User className="w-4 h-4 text-amber-600" />
                    অগ্রিম ব্যক্তি <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="personKey"
                    name="personKey"
                    value={personKey}
                    onChange={handlePersonChange}
                    className="mt-1.5 flex h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                    required
                    disabled={loading}
                  >
                    <option value="">ব্যক্তি নির্বাচন করুন</option>
                    {people.map((p) => (
                      <option
                        key={`${p.type}:${p.id}`}
                        value={`${p.type}:${p.id}`}
                      >
                        {p.name} ({p.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Payment Reference */}
              <div>
                <Label
                  htmlFor="paymentRef"
                  className="text-gray-700 font-medium flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-amber-600" />
                  পেমেন্ট রেফারেন্স
                </Label>
                <Input
                  id="paymentRef"
                  name="paymentRef"
                  value={formData.paymentRef}
                  onChange={handleChange}
                  placeholder="রেফারেন্স (ঐচ্ছিক)"
                  disabled={loading}
                  className="mt-1.5 border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>

              {/* Notes */}
              <div>
                <Label
                  htmlFor="notes"
                  className="text-gray-700 font-medium flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-amber-600" />
                  {labels.notes}
                </Label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  className="mt-1.5 flex w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  disabled={loading}
                  placeholder="অতিরিক্ত তথ্য লিখুন..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-6 text-base shadow-lg hover:shadow-xl transition-all"
                >
                  <Save className="w-5 h-5 mr-2" />
                  {loading ? "সংরক্ষণ করছি..." : labels.save}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                  className="flex-1 sm:flex-none border-2 border-gray-300 hover:bg-gray-50 font-semibold py-6 text-base"
                >
                  <X className="w-5 h-5 mr-2" />
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
