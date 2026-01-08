"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EditExpensePage({
  params,
}: {
  params: { tenderId: string; expenseId: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [expenseDate, setExpenseDate] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [personId, setPersonId] = useState("");

  useEffect(() => {
    loadExpense();
  }, []);

  const loadExpense = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("person_expenses")
        .select("*")
        .eq("id", params.expenseId)
        .single();

      if (error) throw error;

      if (data) {
        setExpenseDate(data.expense_date);
        setAmount(data.amount?.toString() || "");
        setDescription(data.description || "");
        setNotes(data.notes || "");
        setPersonId(data.user_id || data.person_id || "");
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
        .from("person_expenses")
        .update({
          expense_date: expenseDate,
          amount: parseFloat(amount),
          description: description,
          notes: notes || null,
        })
        .eq("id", params.expenseId);

      if (error) throw error;

      // Navigate back to person ledger
      if (personId) {
        router.push(`/tender/${params.tenderId}/advances/people/${personId}`);
      } else {
        router.push(`/tender/${params.tenderId}/advances/people`);
      }
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading expense...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href={`/tender/${params.tenderId}/advances/people/${personId}`}
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-6"
        >
          ← Back to person ledger
        </Link>

        <Card className="shadow-xl">
          <CardHeader className="border-b bg-gradient-to-r from-red-500 to-red-600 text-white">
            <CardTitle>Edit Expense</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div>
                <Label htmlFor="expenseDate">Date *</Label>
                <Input
                  id="expenseDate"
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  required
                  disabled={saving}
                />
              </div>

              <div>
                <Label htmlFor="amount">Amount (টাকা) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  disabled={saving}
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  disabled={saving}
                  placeholder="What was purchased or paid for"
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={saving}
                  placeholder="Additional details..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {saving ? "Saving..." : "সংরক্ষণ করুন"}
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
