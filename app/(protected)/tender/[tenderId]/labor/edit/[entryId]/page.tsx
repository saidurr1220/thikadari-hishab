"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EditLaborEntryPage({
  params,
}: {
  params: { tenderId: string; entryId: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form data
  const [laborType, setLaborType] = useState<"contract" | "daily">("daily");
  const [entryDate, setEntryDate] = useState("");
  const [laborName, setLaborName] = useState("");
  const [crewName, setCrewName] = useState("");
  const [headcount, setHeadcount] = useState("");
  const [khorakiRate, setKhorakiRate] = useState("");
  const [khorakiTotal, setKhorakiTotal] = useState("");
  const [wageRate, setWageRate] = useState("");
  const [wageTotal, setWageTotal] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadEntry();
  }, []);

  const loadEntry = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("labor_entries")
        .select("*")
        .eq("id", params.entryId)
        .single();

      if (error) throw error;

      if (data) {
        setLaborType(data.labor_type);
        setEntryDate(data.entry_date);
        setLaborName(data.labor_name || "");
        setCrewName(data.crew_name || "");
        setHeadcount(data.headcount?.toString() || "");
        setKhorakiRate(data.khoraki_rate?.toString() || "");
        setKhorakiTotal(data.khoraki_total?.toString() || "");
        setWageRate(data.wage_rate?.toString() || "");
        setWageTotal(data.wage_total?.toString() || "");
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

      const updateData: any = {
        labor_type: laborType,
        entry_date: entryDate,
        notes: notes || null,
      };

      if (laborType === "contract") {
        updateData.crew_name = crewName;
        updateData.headcount = parseInt(headcount) || null;
        updateData.khoraki_rate = parseFloat(khorakiRate) || null;
        updateData.khoraki_total = parseFloat(khorakiTotal) || null;
        updateData.wage_rate = parseFloat(wageRate) || null;
        updateData.wage_total = parseFloat(wageTotal) || null;
      } else {
        updateData.labor_name = laborName;
        updateData.khoraki_total = parseFloat(khorakiTotal) || null;
        updateData.wage_total = parseFloat(wageTotal) || null;
      }

      const { error } = await supabase
        .from("labor_entries")
        .update(updateData)
        .eq("id", params.entryId);

      if (error) throw error;

      router.push(`/tender/${params.tenderId}/labor`);
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
            href={`/tender/${params.tenderId}/labor`}
            className="text-blue-600 hover:text-blue-800"
          >
            ← শ্রমিক রেজিস্টার
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>শ্রমিক এন্ট্রি সম্পাদনা</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-100 border border-red-300 rounded p-3">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div>
                <Label>ধরন *</Label>
                <select
                  value={laborType}
                  onChange={(e) =>
                    setLaborType(e.target.value as "contract" | "daily")
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="daily">দৈনিক</option>
                  <option value="contract">চুক্তি</option>
                </select>
              </div>

              <div>
                <Label>তারিখ *</Label>
                <Input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  required
                />
              </div>

              {laborType === "contract" ? (
                <>
                  <div>
                    <Label>দলের নাম *</Label>
                    <Input
                      value={crewName}
                      onChange={(e) => setCrewName(e.target.value)}
                      placeholder="দলের নাম"
                      required
                    />
                  </div>

                  <div>
                    <Label>জনসংখ্যা</Label>
                    <Input
                      type="number"
                      value={headcount}
                      onChange={(e) => setHeadcount(e.target.value)}
                      placeholder="জনসংখ্যা"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>খোরাকি রেট</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={khorakiRate}
                        onChange={(e) => setKhorakiRate(e.target.value)}
                        placeholder="০"
                      />
                    </div>
                    <div>
                      <Label>খোরাকি মোট</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={khorakiTotal}
                        onChange={(e) => setKhorakiTotal(e.target.value)}
                        placeholder="০"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>মজুরি রেট</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={wageRate}
                        onChange={(e) => setWageRate(e.target.value)}
                        placeholder="০"
                      />
                    </div>
                    <div>
                      <Label>মজুরি মোট</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={wageTotal}
                        onChange={(e) => setWageTotal(e.target.value)}
                        placeholder="০"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label>শ্রমিকের নাম *</Label>
                    <Input
                      value={laborName}
                      onChange={(e) => setLaborName(e.target.value)}
                      placeholder="শ্রমিকের নাম"
                      required
                    />
                  </div>

                  <div>
                    <Label>খোরাকি</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={khorakiTotal}
                      onChange={(e) => setKhorakiTotal(e.target.value)}
                      placeholder="০"
                    />
                  </div>

                  <div>
                    <Label>মজুরি</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={wageTotal}
                      onChange={(e) => setWageTotal(e.target.value)}
                      placeholder="০"
                    />
                  </div>
                </>
              )}

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
