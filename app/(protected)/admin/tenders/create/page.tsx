"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { labels } from "@/lib/utils/bangla";

export default function CreateTenderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    tenderCode: "",
    projectName: "",
    location: "",
    clientDepartment: "",
    startDate: "",
    notes: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("আপনি লগইন করা নেই");
        setLoading(false);
        return;
      }

      // Create tender
      const { data: tender, error: tenderError } = await supabase
        .from("tenders")
        .insert({
          tender_code: formData.tenderCode,
          project_name: formData.projectName,
          location: formData.location || null,
          client_department: formData.clientDepartment || null,
          start_date: formData.startDate || null,
          notes: formData.notes || null,
          is_active: true,
          created_by: user.id,
        })
        .select()
        .single();

      if (tenderError) {
        setError(tenderError.message);
        setLoading(false);
        return;
      }

      // Assign current user to tender as owner
      const { error: assignError } = await supabase
        .from("tender_assignments")
        .insert({
          tender_id: tender.id,
          user_id: user.id,
          role: "owner",
          assigned_by: user.id,
        });

      if (assignError) {
        console.error("Assignment error:", assignError);
      }

      // Redirect to tender dashboard
      router.push(`/tender/${tender.id}`);
    } catch (err) {
      setError("টেন্ডার তৈরি করতে সমস্যা হয়েছে");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-6">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
            ← {labels.dashboard}
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>নতুন টেন্ডার তৈরি করুন</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div>
                <Label htmlFor="tenderCode">{labels.tenderCode} *</Label>
                <Input
                  id="tenderCode"
                  name="tenderCode"
                  value={formData.tenderCode}
                  onChange={handleChange}
                  required
                  placeholder="TEST-001"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="projectName">{labels.projectName} *</Label>
                <Input
                  id="projectName"
                  name="projectName"
                  value={formData.projectName}
                  onChange={handleChange}
                  required
                  placeholder="ঢাকা-চট্টগ্রাম মহাসড়ক সংস্কার"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="location">{labels.location}</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="ঢাকা"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="clientDepartment">
                  {labels.clientDepartment}
                </Label>
                <Input
                  id="clientDepartment"
                  name="clientDepartment"
                  value={formData.clientDepartment}
                  onChange={handleChange}
                  placeholder="সড়ক ও জনপথ বিভাগ"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="startDate">{labels.startDate}</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange}
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
                  rows={4}
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="অতিরিক্ত তথ্য..."
                  disabled={loading}
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? labels.loading : labels.create}
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
