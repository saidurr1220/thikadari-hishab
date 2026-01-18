"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EditAdvancePage({
  params,
}: {
  params: { tenderId: string; advanceId: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [advanceDate, setAdvanceDate] = useState("");
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [method, setMethod] = useState("cash");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadAdvance();
  }, []);

  const loadAdvance = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("person_advances")
        .select("*")
        .eq("id", params.advanceId)
        .single();

      if (error) throw error;

      if (data) {
        setAdvanceDate(data.advance_date);
        setAmount(data.amount?.toString() || "");
        setPurpose(data.purpose || "");
        setMethod(data.payment_method || "cash");
        setReference(data.payment_ref || "");
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
        .from("person_advances")
        .update({
          advance_date: advanceDate,
          amount: parseFloat(amount),
          purpose: purpose,
          payment_method: method,
          payment_ref: reference || null,
          notes: notes || null,
        })
        .eq("id", params.advanceId);

      if (error) throw error;

      router.push(`/tender/${params.tenderId}/advances`);
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
            href={`/tender/${params.tenderId}/advances`}
            className="text-blue-600 hover:text-blue-800"
          >
            ← অগ্রিম হিসাব
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>অগ্রিম সম্পাদনা</CardTitle>
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
                  value={advanceDate}
                  onChange={(e) => setAdvanceDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label>টাকার পরিমাণ *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="০"
                  required
                />
              </div>

              <div>
                <Label>উদ্দেশ্য *</Label>
                <Input
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="অগ্রিমের উদ্দেশ্য"
                  required
                />
              </div>

              <div>
                <Label>পদ্ধতি *</Label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="cash">নগদ</option>
                  <option value="bank">ব্যাংক</option>
                  <option value="mfs">মোবাইল ব্যাংকিং</option>
                </select>
              </div>

              <div>
                <Label>রেফারেন্স</Label>
                <Input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="চেক নম্বর / লেনদেন ID"
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
