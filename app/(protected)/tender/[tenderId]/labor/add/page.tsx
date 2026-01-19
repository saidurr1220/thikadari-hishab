"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/format";
import { labels } from "@/lib/utils/bangla";
import {
  ArrowLeft,
  Users,
  Briefcase,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  UserPlus,
  CreditCard,
} from "lucide-react";

type LaborType = "contract" | "daily";

export default function AddLaborPage({
  params,
}: {
  params: { tenderId: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [laborType, setLaborType] = useState<LaborType>("contract");
  const [workTypes, setWorkTypes] = useState<any[]>([]);
  const [subcontractors, setSubcontractors] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [showNewSubForm, setShowNewSubForm] = useState(false);
  const [newSubName, setNewSubName] = useState("");
  const [newSubPhone, setNewSubPhone] = useState("");
  const [newSubNotes, setNewSubNotes] = useState("");

  const [formData, setFormData] = useState({
    entryDate: new Date().toISOString().split("T")[0],
    crewName: "",
    workTypeId: "",
    workTypeCustom: "",
    laborName: "",
    headcount: "",
    khorakiRatePerHead: "",
    khorakiTotal: "",
    wageTotal: "",
    notes: "",
    subcontractorId: "",
    paymentMethod: "cash",
    paymentRef: "",
    paidThroughStaff: "",
    paidThroughStaffType: "",
  });

  useEffect(() => {
    loadWorkTypes();
    loadSubcontractors();
    loadStaffList();
    const presetSub = searchParams.get("subcontractorId");
    const presetType = searchParams.get("laborType");
    if (presetSub) {
      setFormData((prev) => ({ ...prev, subcontractorId: presetSub }));
    }
    if (presetType === "daily" || presetType === "contract") {
      setLaborType(presetType);
    }
  }, []);

  const loadWorkTypes = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("work_types")
      .select("*")
      .eq("is_active", true)
      .order("name_bn");
    if (data) setWorkTypes(data);
  };

  const loadSubcontractors = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("subcontractors")
      .select("*")
      .eq("tender_id", params.tenderId)
      .eq("is_active", true)
      .order("name");
    if (data) setSubcontractors(data);
  };

  const loadStaffList = async () => {
    const supabase = createClient();

    // Load auth users
    const { data: authAssignments } = await supabase
      .from("tender_assignments")
      .select(
        `
        user_id,
        role,
        profiles (id, full_name)
      `,
      )
      .eq("tender_id", params.tenderId)
      .not("user_id", "is", null);

    // Load persons (non-auth)
    const { data: personAssignments } = await supabase
      .from("tender_assignments")
      .select(
        `
        person_id,
        role,
        persons (id, full_name)
      `,
      )
      .eq("tender_id", params.tenderId)
      .not("person_id", "is", null);

    const staffArr: any[] = [];

    if (authAssignments) {
      authAssignments.forEach((ta: any) => {
        if (ta.profiles) {
          staffArr.push({
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
          staffArr.push({
            id: ta.persons.id,
            name: ta.persons.full_name,
            role: ta.role,
            type: "person",
          });
        }
      });
    }

    setStaffList(staffArr);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "headcount" || name === "khorakiRatePerHead") {
      const headcount =
        name === "headcount"
          ? parseFloat(value)
          : parseFloat(formData.headcount);
      const rate =
        name === "khorakiRatePerHead"
          ? parseFloat(value)
          : parseFloat(formData.khorakiRatePerHead);
      if (headcount && rate) {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
          khorakiTotal: (headcount * rate).toString(),
        }));
      }
    }
  };

  const baseTotal =
    (parseFloat(formData.khorakiTotal) || 0) +
    (parseFloat(formData.wageTotal) || 0);
  const fee = formData.paymentMethod === "mfs" ? baseTotal * 0.0185 + 10 : 0;

  const handleCreateSubcontractor = async () => {
    if (!newSubName.trim()) {
      setError("Subcontractor name is required.");
      return;
    }
    const supabase = createClient();
    const { error: subError } = await supabase.from("subcontractors").insert({
      tender_id: params.tenderId,
      name: newSubName.trim(),
      phone: newSubPhone || null,
      notes: newSubNotes || null,
    });
    if (subError) {
      setError(subError.message);
      return;
    }
    setNewSubName("");
    setNewSubPhone("");
    setNewSubNotes("");
    setShowNewSubForm(false);
    loadSubcontractors();
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
        setError("Not authenticated.");
        setLoading(false);
        return;
      }
      if (laborType === "contract" && !formData.crewName) {
        setError("Crew name is required for contract labor.");
        setLoading(false);
        return;
      }
      if (!formData.khorakiTotal && !formData.wageTotal) {
        setError("Enter khoraki or wage amount.");
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase
        .from("labor_entries")
        .insert({
          tender_id: params.tenderId,
          entry_date: formData.entryDate,
          labor_type: laborType,
          crew_name: laborType === "contract" ? formData.crewName : null,
          work_type_id: formData.workTypeId || null,
          work_type_custom: formData.workTypeCustom || null,
          labor_name: laborType === "daily" ? formData.laborName : null,
          headcount: formData.headcount ? parseInt(formData.headcount) : null,
          khoraki_rate_per_head: formData.khorakiRatePerHead
            ? parseFloat(formData.khorakiRatePerHead)
            : null,
          khoraki_total: formData.khorakiTotal
            ? parseFloat(formData.khorakiTotal)
            : null,
          wage_total: formData.wageTotal
            ? parseFloat(formData.wageTotal)
            : null,
          notes: formData.notes || null,
          subcontractor_id: formData.subcontractorId || null,
          payment_method: formData.paymentMethod || null,
          payment_ref: formData.paymentRef || null,
          created_by: user.id,
        });

      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }

      // If payment made through staff, record in their expense ledger
      if (formData.paidThroughStaff && formData.paidThroughStaffType) {
        const totalPaid = baseTotal;
        const laborIdentifier =
          laborType === "contract"
            ? formData.crewName
            : formData.laborName || "Labor";

        const selectedStaff = staffList.find(
          (s) =>
            s.id === formData.paidThroughStaff &&
            s.type === formData.paidThroughStaffType,
        );

        const isAuthUser = formData.paidThroughStaffType === "user";

        const { error: staffExpenseError } = await supabase
          .from("person_expenses")
          .insert({
            tender_id: params.tenderId,
            expense_date: formData.entryDate,
            description: `[LABOR PAYMENT] ${laborIdentifier}${formData.workTypeCustom ? ` - ${formData.workTypeCustom}` : ""}`,
            amount: totalPaid,
            notes: `${laborType === "contract" ? "Contract" : "Daily"} labor payment${formData.notes ? ` - ${formData.notes}` : ""}`,
            created_by: user.id,
            user_id: isAuthUser ? formData.paidThroughStaff : null,
            person_id: isAuthUser ? null : formData.paidThroughStaff,
          });

        if (staffExpenseError) {
          console.error("Failed to record staff expense:", staffExpenseError);
          // Don't throw - labor entry was successful
        }
      }

      // If MFS payment, add charge to expenses table
      if (formData.paymentMethod === "mfs" && fee > 0) {
        const { error: mfsChargeError } = await supabase
          .from("activity_expenses")
          .insert({
            tender_id: params.tenderId,
            expense_date: formData.entryDate,
            category: "transport_logistics",
            subcategory: "mfs_charge",
            vendor_name: "MFS Transaction Charge",
            description: `[MFS CHARGE] Labor payment ৳${baseTotal.toFixed(2)}`,
            amount: fee,
            payment_method: formData.paymentMethod,
            payment_ref: formData.paymentRef || null,
            notes: `Auto-generated: 1.85% + ৳10 MFS charge for labor payment`,
            created_by: user.id,
          });

        if (mfsChargeError) {
          console.error("Failed to record MFS charge:", mfsChargeError);
          // Don't throw - labor entry was successful
        }
      }

      router.push(`/tender/${params.tenderId}/labor`);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/tender/${params.tenderId}/labor`}
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to labor list
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <UserPlus className="h-7 w-7 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Add Labor Entry
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Record daily or contract labor expenses
              </p>
            </div>
          </div>
        </div>

        <Card className="shadow-lg border-slate-200">
          <CardHeader className="border-b border-slate-100 bg-white">
            <CardTitle className="text-xl font-semibold text-gray-900">
              Labor Entry Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-red-800 text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Labor Type Tabs */}
              <div className="space-y-2">
                <Label className="text-base font-semibold text-gray-900">
                  Labor Type *
                </Label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setLaborType("contract")}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-lg border-2 font-semibold transition-all ${
                      laborType === "contract"
                        ? "border-purple-500 bg-purple-50 text-purple-700 shadow-md"
                        : "border-gray-200 bg-white text-gray-600 hover:border-purple-200 hover:bg-purple-50/50"
                    }`}
                  >
                    <Briefcase className="h-5 w-5" />
                    {labels.contract}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLaborType("daily")}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-lg border-2 font-semibold transition-all ${
                      laborType === "daily"
                        ? "border-blue-500 bg-blue-50 text-blue-700 shadow-md"
                        : "border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:bg-blue-50/50"
                    }`}
                  >
                    <Users className="h-5 w-5" />
                    {labels.daily}
                  </button>
                </div>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label
                  htmlFor="entryDate"
                  className="text-sm font-semibold text-gray-900 flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4 text-gray-500" />
                  {labels.date} *
                </Label>
                <Input
                  id="entryDate"
                  name="entryDate"
                  type="date"
                  value={formData.entryDate}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {/* Contract Fields */}
              {laborType === "contract" && (
                <div className="space-y-2">
                  <Label
                    htmlFor="crewName"
                    className="text-sm font-semibold text-gray-900"
                  >
                    {labels.crewName} *
                  </Label>
                  <Input
                    id="crewName"
                    name="crewName"
                    value={formData.crewName}
                    onChange={handleChange}
                    placeholder="Enter crew or team name"
                    disabled={loading}
                    className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              )}

              {/* Daily Fields */}
              {laborType === "daily" && (
                <div className="space-y-2">
                  <Label
                    htmlFor="laborName"
                    className="text-sm font-semibold text-gray-900"
                  >
                    {labels.laborName}
                  </Label>
                  <Input
                    id="laborName"
                    name="laborName"
                    value={formData.laborName}
                    onChange={handleChange}
                    placeholder="Worker name (optional)"
                    disabled={loading}
                    className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              )}

              {/* Work Type */}
              <div className="space-y-2">
                <Label
                  htmlFor="workTypeId"
                  className="text-sm font-semibold text-gray-900"
                >
                  {labels.workType}
                </Label>
                <select
                  id="workTypeId"
                  name="workTypeId"
                  value={formData.workTypeId}
                  onChange={handleChange}
                  className="flex h-11 w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                  disabled={loading}
                >
                  <option value="">Select work type</option>
                  {workTypes.map((wt) => (
                    <option key={wt.id} value={wt.id}>
                      {wt.name_bn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Headcount */}
              <div className="space-y-2">
                <Label
                  htmlFor="headcount"
                  className="text-sm font-semibold text-gray-900 flex items-center gap-2"
                >
                  <Users className="h-4 w-4 text-gray-500" />
                  {labels.headcount}
                </Label>
                <Input
                  id="headcount"
                  name="headcount"
                  type="number"
                  value={formData.headcount}
                  onChange={handleChange}
                  placeholder="Number of workers"
                  disabled={loading}
                  className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {/* Khoraki */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="khorakiRatePerHead"
                    className="text-sm font-semibold text-gray-900"
                  >
                    {labels.khorakiPerHead}
                  </Label>
                  <Input
                    id="khorakiRatePerHead"
                    name="khorakiRatePerHead"
                    type="number"
                    step="0.01"
                    value={formData.khorakiRatePerHead}
                    onChange={handleChange}
                    placeholder="Rate per person"
                    disabled={loading}
                    className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="khorakiTotal"
                    className="text-sm font-semibold text-gray-900"
                  >
                    {labels.khorakiTotal}
                  </Label>
                  <Input
                    id="khorakiTotal"
                    name="khorakiTotal"
                    type="number"
                    step="0.01"
                    value={formData.khorakiTotal}
                    onChange={handleChange}
                    placeholder="Total khoraki amount"
                    disabled={loading}
                    className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>

              {/* Wage */}
              <div className="space-y-2">
                <Label
                  htmlFor="wageTotal"
                  className="text-sm font-semibold text-gray-900 flex items-center gap-2"
                >
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  {labels.wageTotal}
                </Label>
                <Input
                  id="wageTotal"
                  name="wageTotal"
                  type="number"
                  step="0.01"
                  value={formData.wageTotal}
                  onChange={handleChange}
                  placeholder="Total wage amount"
                  disabled={loading}
                  className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {/* Subcontractor */}
              <div className="space-y-3">
                <Label
                  htmlFor="subcontractorId"
                  className="text-sm font-semibold text-gray-900 flex items-center gap-2"
                >
                  <Briefcase className="h-4 w-4 text-gray-500" />
                  Subcontractor / Team
                </Label>
                <div className="flex gap-2">
                  <select
                    id="subcontractorId"
                    name="subcontractorId"
                    value={formData.subcontractorId}
                    onChange={handleChange}
                    className="flex h-11 w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                    disabled={loading}
                  >
                    <option value="">Select subcontractor</option>
                    {subcontractors.map((sc) => (
                      <option key={sc.id} value={sc.id}>
                        {sc.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewSubForm((p) => !p)}
                    disabled={loading}
                    className="border-2 hover:bg-blue-50 hover:border-blue-300"
                  >
                    + New
                  </Button>
                </div>
                {showNewSubForm && (
                  <div className="space-y-3 rounded-lg border-2 border-blue-200 p-4 bg-blue-50/50">
                    <h4 className="font-semibold text-gray-900 text-sm">
                      Add New Subcontractor
                    </h4>
                    <Input
                      placeholder="Name *"
                      value={newSubName}
                      onChange={(e) => setNewSubName(e.target.value)}
                      disabled={loading}
                      className="border-gray-300 bg-white"
                    />
                    <Input
                      placeholder="Phone (optional)"
                      value={newSubPhone}
                      onChange={(e) => setNewSubPhone(e.target.value)}
                      disabled={loading}
                      className="border-gray-300 bg-white"
                    />
                    <textarea
                      placeholder="Notes (optional)"
                      value={newSubNotes}
                      onChange={(e) => setNewSubNotes(e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                      disabled={loading}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={handleCreateSubcontractor}
                        disabled={loading}
                        className="gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Save Subcontractor
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setShowNewSubForm(false)}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  Payment Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="paymentMethod"
                      className="text-sm font-semibold text-gray-900"
                    >
                      Payment Method
                    </Label>
                    <select
                      id="paymentMethod"
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleChange}
                      className="flex h-11 w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                      disabled={loading}
                    >
                      <option value="cash">💵 Cash</option>
                      <option value="bank">🏦 Bank</option>
                      <option value="mfs">📱 bKash / MFS</option>
                      <option value="advance">📝 Advance</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="paymentRef"
                      className="text-sm font-semibold text-gray-900"
                    >
                      Payment Reference
                    </Label>
                    <Input
                      id="paymentRef"
                      name="paymentRef"
                      value={formData.paymentRef}
                      onChange={handleChange}
                      placeholder="Ref no. (optional)"
                      disabled={loading}
                      className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                </div>

                {/* Paid Through Staff */}
                <div className="space-y-2">
                  <Label
                    htmlFor="paidThroughStaff"
                    className="text-sm font-semibold text-gray-900"
                  >
                    Paid Through Staff (Optional)
                  </Label>
                  <select
                    id="paidThroughStaff"
                    value={
                      formData.paidThroughStaff
                        ? `${formData.paidThroughStaffType}:${formData.paidThroughStaff}`
                        : ""
                    }
                    onChange={(e) => {
                      const [type, id] = e.target.value.split(":");
                      setFormData((prev) => ({
                        ...prev,
                        paidThroughStaff: id || "",
                        paidThroughStaffType: type || "",
                      }));
                    }}
                    className="flex h-11 w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                    disabled={loading}
                  >
                    <option value="">Direct payment (not through staff)</option>
                    {staffList.map((staff) => (
                      <option
                        key={`${staff.type}:${staff.id}`}
                        value={`${staff.type}:${staff.id}`}
                      >
                        {staff.name} ({staff.role})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-600 mt-1">
                    Select if this payment was made by a staff member. It will
                    be recorded in their expense ledger.
                  </p>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label
                  htmlFor="notes"
                  className="text-sm font-semibold text-gray-900"
                >
                  {labels.notes}
                </Label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="flex w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                  placeholder="Additional notes or details"
                  disabled={loading}
                />
              </div>

              {/* Total Display */}
              {(formData.khorakiTotal || formData.wageTotal) && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-900">
                      Cost Summary
                    </h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-gray-700">
                      <span>Base Amount:</span>
                      <span className="font-semibold text-lg">
                        {formatCurrency(baseTotal || 0)}
                      </span>
                    </div>
                    {fee > 0 && (
                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>bKash Fee (1.85% + ৳10):</span>
                        <span className="font-medium">
                          {formatCurrency(fee)}
                        </span>
                      </div>
                    )}
                    <div className="pt-2 border-t-2 border-blue-300 flex justify-between items-center">
                      <span className="font-semibold text-gray-900">
                        Total Project Cost:
                      </span>
                      <span className="font-bold text-2xl text-blue-600">
                        {formatCurrency(baseTotal + fee)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all gap-2"
                >
                  <CheckCircle className="h-5 w-5" />
                  {loading ? labels.loading : labels.save}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                  className="h-12 px-8 border-2 hover:bg-gray-50"
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
