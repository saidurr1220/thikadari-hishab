"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { labels } from "@/lib/utils/bangla";
import { formatCurrency } from "@/lib/utils/format";
import MFSChargeCalculator from "@/components/MFSChargeCalculator";

export default function GiveAdvancePage({
  params,
}: {
  params: { tenderId: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");
  const [newPersonRole, setNewPersonRole] = useState("site_manager");
  const [mfsCharge, setMfsCharge] = useState(0);
  const [totalWithCharge, setTotalWithCharge] = useState(0);
  const [personKey, setPersonKey] = useState("");

  const [formData, setFormData] = useState({
    advanceDate: new Date().toISOString().split("T")[0],
    personId: "",
    personType: "",
    amount: "",
    method: "cash",
    reference: "",
    purpose: "",
    notes: "",
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const supabase = createClient();

    // Load auth users
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

    // Load persons (non-auth)
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

    const userList: any[] = [];

    // Add auth users
    if (authAssignments) {
      authAssignments.forEach((ta: any) => {
        if (ta.profiles) {
          userList.push({
            id: ta.profiles.id,
            name: ta.profiles.full_name,
            role: ta.role,
            type: "user",
          });
        }
      });
    }

    // Add persons
    if (personAssignments) {
      personAssignments.forEach((ta: any) => {
        if (ta.persons) {
          userList.push({
            id: ta.persons.id,
            name: ta.persons.full_name,
            role: ta.role,
            type: "person",
          });
        }
      });
    }

    setUsers(userList);
  };

  const handleAddPerson = async () => {
    if (!newPersonName.trim()) {
      setError("নাম লিখুন");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Create person entry (non-auth user)
      const { data: newPerson, error: personError } = await supabase
        .from("persons")
        .insert({
          full_name: newPersonName,
          role: newPersonRole,
          created_by: user?.id,
        })
        .select()
        .single();

      if (personError) throw personError;

      // Assign to tender
      const { error: assignError } = await supabase
        .from("tender_assignments")
        .insert({
          tender_id: params.tenderId,
          person_id: newPerson.id,
          role: newPersonRole,
        });

      if (assignError) throw assignError;

      // Reload users
      await loadUsers();
      setShowAddPerson(false);
      setNewPersonName("");
      setPersonKey(`person:${newPerson.id}`);
      setFormData((prev) => ({
        ...prev,
        personId: newPerson.id,
        personType: "person",
      }));
      setError("");
    } catch (err: any) {
      setError(err.message || "ব্যক্তি যোগ করতে সমস্যা হয়েছে");
    }
    setLoading(false);
  };

  const loadPersonBalance = async (personId: string) => {
    const supabase = createClient();
    const { data } = await supabase.rpc("get_person_balance", {
      p_tender_id: params.tenderId,
      p_person_id: personId,
    });

    if (data && data.length > 0) {
      setCurrentBalance(data[0].balance);
    } else {
      setCurrentBalance(0);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePersonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setPersonKey(value);

    if (!value) {
      setFormData((prev) => ({ ...prev, personId: "", personType: "" }));
      setCurrentBalance(null);
      return;
    }

    const [personType, personId] = value.split(":");
    setFormData((prev) => ({ ...prev, personId, personType }));
    loadPersonBalance(personId);
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
        setError("আপনি লগইন করা নেই");
        setLoading(false);
        return;
      }

      // Only insert if amount is greater than 0
      const amount = parseFloat(formData.amount);
      if (amount > 0) {
        const isAuthUser = formData.personType === "user";
        const { error: insertError } = await supabase
          .from("person_advances")
          .insert({
            tender_id: params.tenderId,
            advance_date: formData.advanceDate,
            user_id: isAuthUser ? formData.personId : null,
            person_id: !isAuthUser ? formData.personId : null,
            amount: amount,
            payment_method: formData.method,
            payment_ref: formData.reference || null,
            purpose: formData.purpose || "অগ্রিম প্রদান",
            notes: formData.notes || null,
            created_by: user.id,
          });

        if (insertError) {
          setError(insertError.message);
          setLoading(false);
          return;
        }
      }

      router.push(`/tender/${params.tenderId}/advances`);
    } catch (err) {
      setError("এন্ট্রি যোগ করতে সমস্যা হয়েছে");
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
            ← টেন্ডার ড্যাশবোর্ড
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>নতুন ব্যক্তি যোগ করুন / অগ্রিম দিন</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div>
                <Label htmlFor="advanceDate">{labels.date} *</Label>
                <Input
                  id="advanceDate"
                  name="advanceDate"
                  type="date"
                  value={formData.advanceDate}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="personKey">{labels.person} *</Label>
                  <button
                    type="button"
                    onClick={() => setShowAddPerson(!showAddPerson)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + নতুন ব্যক্তি যোগ করুন
                  </button>
                </div>

                {showAddPerson && (
                  <div className="mb-4 p-4 border border-blue-200 rounded-lg bg-blue-50">
                    <h4 className="font-semibold mb-3">
                      নতুন ব্যক্তি যোগ করুন
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="newPersonName">নাম *</Label>
                        <Input
                          id="newPersonName"
                          value={newPersonName}
                          onChange={(e) => setNewPersonName(e.target.value)}
                          placeholder="ব্যক্তির নাম"
                        />
                      </div>
                      <div>
                        <Label htmlFor="newPersonRole">ভূমিকা *</Label>
                        <select
                          id="newPersonRole"
                          value={newPersonRole}
                          onChange={(e) => setNewPersonRole(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                        >
                          <option value="site_manager">সাইট ম্যানেজার</option>
                          <option value="site_engineer">
                            সাইট ইঞ্জিনিয়ার
                          </option>
                          <option value="foreman">ফোরম্যান</option>
                          <option value="driver">ড্রাইভার</option>
                          <option value="supplier">সরবরাহকারী</option>
                          <option value="contractor">ঠিকাদার</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={handleAddPerson}
                          disabled={loading}
                          size="sm"
                        >
                          যোগ করুন
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowAddPerson(false)}
                          size="sm"
                        >
                          বাতিল
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <select
                  id="personKey"
                  name="personKey"
                  value={personKey}
                  onChange={handlePersonChange}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  required
                  disabled={loading}
                >
                  <option value="">নির্বাচন করুন</option>
                  {users.map((u) => (
                    <option
                      key={`${u.type}:${u.id}`}
                      value={`${u.type}:${u.id}`}
                    >
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
                {currentBalance !== null && (
                  <p className="text-sm text-gray-600 mt-2">
                    বর্তমান ব্যালেন্স:{" "}
                    <span
                      className={`font-semibold ${
                        currentBalance > 0
                          ? "text-green-600"
                          : currentBalance < 0
                          ? "text-red-600"
                          : "text-gray-600"
                      }`}
                    >
                      {formatCurrency(Math.abs(currentBalance))}
                    </span>
                    {currentBalance > 0
                      ? " (বাকি)"
                      : currentBalance < 0
                      ? " (পাওনা)"
                      : ""}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="amount">
                  {labels.amount} (ঐচ্ছিক - ০ দিলে শুধু ব্যক্তি যোগ হবে)
                </Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0"
                  disabled={loading}
                />
              </div>

              {parseFloat(formData.amount || "0") > 0 && (
                <>
                  <div>
                    <Label htmlFor="method">পদ্ধতি *</Label>
                    <select
                      id="method"
                      name="method"
                      value={formData.method}
                      onChange={handleChange}
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                      required
                      disabled={loading}
                    >
                      <option value="cash">{labels.cash}</option>
                      <option value="bank">{labels.bank}</option>
                      <option value="mfs">{labels.mfs}</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="reference">রেফারেন্স</Label>
                    <Input
                      id="reference"
                      name="reference"
                      value={formData.reference}
                      onChange={handleChange}
                      placeholder="TXN123456"
                      disabled={loading}
                    />
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="purpose">{labels.purpose}</Label>
                <Input
                  id="purpose"
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleChange}
                  placeholder="সাইট খরচের জন্য / ব্যক্তি যোগ করা"
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
