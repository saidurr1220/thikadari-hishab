"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TenderSettingsPage({
  params,
}: {
  params: { tenderId: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Tender data
  const [projectName, setProjectName] = useState("");
  const [tenderCode, setTenderCode] = useState("");
  const [location, setLocation] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    loadTender();
  }, []);

  const loadTender = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("tenders")
        .select("*")
        .eq("id", params.tenderId)
        .single();

      if (error) throw error;

      if (data) {
        setProjectName(data.project_name);
        setTenderCode(data.tender_code);
        setLocation(data.location || "");
        setIsActive(data.is_active);
      }
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("tenders")
        .update({
          project_name: projectName,
          tender_code: tenderCode,
          location: location || null,
          is_active: isActive,
        })
        .eq("id", params.tenderId);

      if (error) throw error;

      setSuccess("সফলভাবে সংরক্ষণ হয়েছে!");
      setTimeout(() => {
        router.push(`/tender/${params.tenderId}`);
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmText) {
      setError("নিশ্চিত করতে কিছু লিখুন");
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("লগইন করা নেই");
        setDeleting(false);
        return;
      }

      const { error: deleteError } = await supabase
        .from("tenders")
        .delete()
        .eq("id", params.tenderId);

      if (deleteError) {
        setError(deleteError.message);
        setDeleting(false);
        return;
      }

      // Redirect to dashboard
      setTimeout(() => {
        window.location.replace("/dashboard?t=" + Date.now());
      }, 500);
    } catch (err: any) {
      setError(err.message);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-6">
          <Link
            href={`/tender/${params.tenderId}`}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            টেন্ডার ড্যাশবোর্ড
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          টেন্ডার সেটিংস
        </h1>

        {/* General Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>সাধারণ তথ্য</CardTitle>
            <p className="text-sm text-gray-600">
              টেন্ডারের নাম, কোড এবং অবস্থান পরিবর্তন করুন
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdate} className="space-y-4">
              {error && !showDeleteConfirm && (
                <div className="bg-red-100 border border-red-300 rounded-lg p-3">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-100 border border-green-300 rounded-lg p-3">
                  <p className="text-green-800 text-sm">{success}</p>
                </div>
              )}

              <div>
                <Label htmlFor="projectName">প্রকল্পের নাম *</Label>
                <Input
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="প্রকল্পের নাম"
                  required
                  disabled={saving}
                />
              </div>

              <div>
                <Label htmlFor="tenderCode">টেন্ডার কোড *</Label>
                <Input
                  id="tenderCode"
                  value={tenderCode}
                  onChange={(e) => setTenderCode(e.target.value)}
                  placeholder="যেমন: T-2024-001"
                  required
                  disabled={saving}
                />
              </div>

              <div>
                <Label htmlFor="location">অবস্থান</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="প্রকল্পের অবস্থান"
                  disabled={saving}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                  disabled={saving}
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  টেন্ডার সক্রিয় আছে
                </Label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      সংরক্ষণ করছি...
                    </span>
                  ) : (
                    "সংরক্ষণ করুন"
                  )}
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

        {/* Danger Zone */}
        <Card className="border-2 border-red-200">
          <CardHeader className="bg-red-50">
            <CardTitle className="text-red-900 flex items-center gap-2">
              <span>⚠️</span>
              বিপজ্জনক এলাকা
            </CardTitle>
            <p className="text-sm text-red-700">
              এই কাজগুলো অপরিবর্তনীয়। সাবধানে এগিয়ে যান।
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            {!showDeleteConfirm ? (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  টেন্ডার মুছে ফেলুন
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  এই টেন্ডার এবং এর সাথে সম্পর্কিত সব ডেটা স্থায়ীভাবে মুছে
                  যাবে।
                </p>
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  variant="outline"
                  className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                >
                  টেন্ডার মুছে ফেলুন
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white border-2 border-red-300 rounded-lg p-4">
                  <h4 className="font-bold text-red-900 mb-2">
                    আপনি কি নিশ্চিত?
                  </h4>
                  <p className="text-sm text-red-700 mb-4">
                    এই টেন্ডার এবং এর সাথে সম্পর্কিত সব ডেটা (শ্রমিক, মালামাল,
                    খরচ, অগ্রিম ইত্যাদি) স্থায়ীভাবে মুছে যাবে। এই কাজ আর
                    ফিরিয়ে আনা যাবে না।
                  </p>

                  {error && showDeleteConfirm && (
                    <div className="bg-red-100 border border-red-300 rounded p-3 mb-4">
                      <p className="text-red-800 text-sm">{error}</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="confirmText" className="text-red-900">
                        নিশ্চিত করতে "DELETE" লিখুন *
                      </Label>
                      <Input
                        id="confirmText"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="DELETE"
                        disabled={deleting}
                        className="border-red-300"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={handleDelete}
                        disabled={deleting || confirmText !== "DELETE"}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        {deleting ? (
                          <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            মুছছি...
                          </span>
                        ) : (
                          "হ্যাঁ, মুছে ফেলুন"
                        )}
                      </Button>
                      <Button
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setConfirmText("");
                          setError("");
                        }}
                        variant="outline"
                        disabled={deleting}
                      >
                        না, বাতিল করুন
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
