"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface EntryActionsProps {
  entryId: string;
  tableName: string;
  onDelete?: () => void;
  editUrl?: string;
}

export default function EntryActions({
  entryId,
  tableName,
  onDelete,
  editUrl,
}: EntryActionsProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      // Check if user is authenticated
      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log("Current user:", user?.id);

      if (!user) {
        setError("আপনি লগইন করা নেই");
        setLoading(false);
        return;
      }

      console.log("Deleting entry:", { entryId, tableName });

      // First, delete any related auto-generated payments if this is a purchase
      if (tableName === "material_purchases" || tableName === "vendor_purchases") {
        // Get all payments that might be related to this purchase
        const { data: allPayments } = await supabase
          .from("vendor_payments")
          .select("id, notes");

        // Filter for payments that mention this purchase ID
        const relatedPayments = allPayments?.filter(p => 
          p.notes?.toLowerCase().includes(entryId.toLowerCase()) ||
          p.notes?.toLowerCase().includes(`purchase ${entryId}`)
        ) || [];

        if (relatedPayments.length > 0) {
          await supabase
            .from("vendor_payments")
            .delete()
            .in("id", relatedPayments.map(p => p.id));
          console.log("Deleted related payments:", relatedPayments.length);
        }
      }

      const { data, error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq("id", entryId)
        .select();

      console.log("Delete result:", { data, error: deleteError });

      if (deleteError) {
        console.error("Delete error:", deleteError);
        setError(`Error: ${deleteError.message}`);
        setLoading(false);
        return;
      }

      // Success - force hard reload to refresh data
      console.log("Delete successful, reloading page...");
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    } catch (err: any) {
      console.error("Catch error:", err);
      setError(err.message || "মুছতে সমস্যা হয়েছে");
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Three dots menu button */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        title="আরও অপশন"
      >
        <svg
          className="w-5 h-5 text-gray-600"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            {editUrl && (
              <button
                onClick={() => router.push(editUrl)}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
              >
                <span>✏️</span>
                <span>সম্পাদনা করুন</span>
              </button>
            )}
            <button
              onClick={() => {
                setShowDeleteConfirm(true);
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 text-sm border-t"
            >
              <span>🗑️</span>
              <span>মুছে ফেলুন</span>
            </button>
          </div>
        </>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              নিশ্চিত করুন
            </h3>
            <p className="text-gray-600 mb-4">
              আপনি কি এই এন্ট্রি মুছে ফেলতে চান? এই কাজ আর ফিরিয়ে আনা যাবে না।
            </p>

            {error && (
              <div className="bg-red-100 border border-red-300 rounded p-3 mb-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setError("");
                }}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                বাতিল
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? "মুছছি..." : "হ্যাঁ, মুছে ফেলুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
