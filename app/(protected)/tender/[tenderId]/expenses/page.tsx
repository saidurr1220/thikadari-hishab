"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { labels } from "@/lib/utils/bangla";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export default function ExpensesListPage({
  params,
}: {
  params: { tenderId: string };
}) {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("expense_submissions")
      .select(
        `
        *,
        expense_categories (name_bn),
        expense_subcategories (name_bn),
        users (full_name)
      `
      )
      .eq("tender_id", params.tenderId)
      .order("expense_date", { ascending: false })
      .limit(50);

    if (data) setExpenses(data);
    setLoading(false);
  };

  const handleApprove = async (expenseId: string) => {
    setActionLoading(expenseId);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("expense_submissions")
      .update({
        status: "approved",
        approved_by: user?.id,
        approved_at: new Date().toISOString(),
      })
      .eq("id", expenseId);

    if (!error) {
      await loadExpenses();
    }
    setActionLoading(null);
  };

  const handleReject = async (expenseId: string) => {
    setActionLoading(expenseId);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("expense_submissions")
      .update({
        status: "rejected",
        approved_by: user?.id,
        approved_at: new Date().toISOString(),
      })
      .eq("id", expenseId);

    if (!error) {
      await loadExpenses();
    }
    setActionLoading(null);
  };

  const pendingCount = expenses.filter((e) => e.status === "pending").length;
  const approvedTotal =
    expenses
      .filter((e) => e.status === "approved")
      .reduce((sum, e) => sum + Number(e.amount || 0), 0) || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center">{labels.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <Link
              href={`/tender/${params.tenderId}`}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              ← টেন্ডার ড্যাশবোর্ড
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">
              খরচ জমা সমূহ
            </h1>
          </div>
          <Link href={`/tender/${params.tenderId}/expenses/submit`}>
            <Button>+ খরচ জমা দিন</Button>
          </Link>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                অনুমোদন বাকি
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {pendingCount}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                অনুমোদিত মোট
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(approvedTotal)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                মোট এন্ট্রি
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{expenses.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Expenses List */}
        <Card>
          <CardHeader>
            <CardTitle>সাম্প্রতিক খরচ সমূহ</CardTitle>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">কোন খরচ নেই</p>
                <Link href={`/tender/${params.tenderId}/expenses/submit`}>
                  <Button>প্রথম খরচ জমা দিন</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              expense.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : expense.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {expense.status === "approved"
                              ? labels.approved
                              : expense.status === "rejected"
                              ? labels.rejected
                              : labels.pending}
                          </span>
                          <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {expense.expense_categories?.name_bn}
                          </span>
                        </div>
                        <h3 className="font-semibold text-lg mb-1">
                          {expense.description}
                        </h3>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>জমাদাতা: {expense.users?.full_name}</p>
                          <p>{formatDate(expense.expense_date)}</p>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-xl font-bold text-blue-600">
                          {formatCurrency(expense.amount)}
                        </p>
                      </div>
                    </div>

                    {expense.notes && (
                      <p className="text-sm text-gray-600 mb-3 pb-3 border-b">
                        {expense.notes}
                      </p>
                    )}

                    {expense.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(expense.id)}
                          disabled={actionLoading === expense.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {actionLoading === expense.id
                            ? labels.loading
                            : labels.approve}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(expense.id)}
                          disabled={actionLoading === expense.id}
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          {labels.reject}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
