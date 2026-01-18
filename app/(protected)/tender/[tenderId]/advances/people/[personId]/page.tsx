"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import {
  ArrowLeft,
  User,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Plus,
  CreditCard,
  Receipt,
} from "lucide-react";
import EntryActions from "@/components/EntryActions";

type PersonInfo = {
  name: string;
  role: string | null;
  isUser: boolean;
};

type Transaction = {
  id: string;
  date: string;
  type: "advance" | "expense";
  amount: number;
  description: string;
  payment_method?: string;
  payment_ref?: string;
  purpose?: string;
  notes?: string;
};

export default function PersonAdvanceLedgerPage({
  params,
}: {
  params: { tenderId: string; personId: string };
}) {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [person, setPerson] = useState<PersonInfo | null>(null);
  const [advances, setAdvances] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [error, setError] = useState("");

  const [showAdvanceForm, setShowAdvanceForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [advanceForm, setAdvanceForm] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    method: "cash",
    ref: "",
    purpose: "",
    notes: "",
  });

  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    description: "",
    notes: "",
  });

  const transactions = useMemo(() => {
    const advTxn: Transaction[] = advances.map((a) => ({
      id: a.id,
      date: a.advance_date,
      type: "advance" as const,
      amount: Number(a.amount),
      description: a.purpose || "Advance given",
      payment_method: a.payment_method,
      payment_ref: a.payment_ref,
      notes: a.notes,
    }));

    const expTxn: Transaction[] = expenses.map((e) => ({
      id: e.id,
      date: e.expense_date,
      type: "expense" as const,
      amount: Number(e.amount),
      description: e.description,
      notes: e.notes,
    }));

    // Sort by date (oldest first) to calculate running balance
    const sorted = [...advTxn, ...expTxn].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate running balance for each transaction
    let runningBalance = 0;
    const withBalance = sorted.map((txn) => {
      if (txn.type === "advance") {
        runningBalance += txn.amount;
      } else {
        runningBalance -= txn.amount;
      }
      return {
        ...txn,
        balance: runningBalance,
      };
    });

    // Return in reverse order (newest first) for display
    return withBalance.reverse();
  }, [advances, expenses]);

  const stats = useMemo(() => {
    const totalAdvances = advances.reduce((sum, a) => sum + Number(a.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const balance = totalAdvances - totalExpenses;
    return {
      totalAdvances,
      totalExpenses,
      balance,
      advanceCount: advances.length,
      expenseCount: expenses.length,
    };
  }, [advances, expenses]);

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAll = async () => {
    setLoading(true);
    setError("");

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", params.personId)
      .maybeSingle();

    const { data: personRow } = await supabase
      .from("persons")
      .select("full_name, role")
      .eq("id", params.personId)
      .maybeSingle();

    const { data: assignment } = await supabase
      .from("tender_assignments")
      .select("role")
      .eq("tender_id", params.tenderId)
      .or(`user_id.eq.${params.personId},person_id.eq.${params.personId}`)
      .maybeSingle();

    const isUser = !!profile;
    setPerson({
      name: profile?.full_name || personRow?.full_name || "Unknown",
      role: assignment?.role || personRow?.role || null,
      isUser,
    });

    const { data: advanceData } = await supabase
      .from("person_advances")
      .select("*")
      .eq("tender_id", params.tenderId)
      .or(`user_id.eq.${params.personId},person_id.eq.${params.personId}`)
      .order("advance_date", { ascending: false });

    const { data: expenseData } = await supabase
      .from("person_expenses")
      .select("*")
      .eq("tender_id", params.tenderId)
      .or(`user_id.eq.${params.personId},person_id.eq.${params.personId}`)
      .order("expense_date", { ascending: false });

    setAdvances(advanceData || []);
    setExpenses(expenseData || []);
    setLoading(false);
  };

  const submitAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!person) return;

    setSubmitting(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("Not authenticated");

      const payload = {
        tender_id: params.tenderId,
        advance_date: advanceForm.date,
        amount: parseFloat(advanceForm.amount || "0"),
        payment_method: advanceForm.method as any,
        payment_ref: advanceForm.ref || null,
        purpose: advanceForm.purpose || null,
        notes: advanceForm.notes || null,
        created_by: userId,
        user_id: person.isUser ? params.personId : null,
        person_id: person.isUser ? null : params.personId,
      };

      const { error: insertError } = await supabase
        .from("person_advances")
        .insert(payload);

      if (insertError) throw insertError;

      setAdvanceForm({
        date: new Date().toISOString().split("T")[0],
        amount: "",
        method: "cash",
        ref: "",
        purpose: "",
        notes: "",
      });
      setShowAdvanceForm(false);
      loadAll();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const submitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!person) return;

    setSubmitting(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("Not authenticated");

      const payload = {
        tender_id: params.tenderId,
        expense_date: expenseForm.date,
        description: expenseForm.description,
        amount: parseFloat(expenseForm.amount || "0"),
        notes: expenseForm.notes || null,
        created_by: userId,
        user_id: person.isUser ? params.personId : null,
        person_id: person.isUser ? null : params.personId,
      };

      const { error: insertError } = await supabase
        .from("person_expenses")
        .insert(payload);

      if (insertError) throw insertError;

      setExpenseForm({
        date: new Date().toISOString().split("T")[0],
        amount: "",
        description: "",
        notes: "",
      });
      setShowExpenseForm(false);
      loadAll();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading person details...</p>
        </div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Person not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <Link
            href={`/tender/${params.tenderId}/advances/people`}
            className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 mb-3 sm:mb-4"
          >
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            Back to staff
          </Link>

          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 truncate">
                    {person.name}
                  </h1>
                  {person.role && (
                    <p className="text-sm text-slate-600 mt-1">
                      {person.role}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setShowAdvanceForm(true)}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                <CreditCard className="h-4 w-4" />
                Give Advance
              </Button>
              <Button
                onClick={() => setShowExpenseForm(true)}
                variant="outline"
                className="gap-2"
              >
                <Receipt className="h-4 w-4" />
                Record Expense
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Total Advances
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalAdvances)}
              </div>
              <p className="text-xs opacity-80 mt-1">
                {stats.advanceCount} transactions
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Total Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalExpenses)}
              </div>
              <p className="text-xs opacity-80 mt-1">
                {stats.expenseCount} records
              </p>
            </CardContent>
          </Card>

          <Card
            className={`bg-gradient-to-br ${
              stats.balance > 0
                ? "from-blue-500 to-blue-600"
                : stats.balance < 0
                ? "from-orange-500 to-orange-600"
                : "from-slate-500 to-slate-600"
            } text-white`}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                {stats.balance > 0 ? "Remaining Balance" : stats.balance < 0 ? "Over Spent" : "Balanced"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(Math.abs(stats.balance))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Expense Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalAdvances > 0
                  ? Math.round((stats.totalExpenses / stats.totalAdvances) * 100)
                  : 0}
                %
              </div>
              <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                <div
                  className="bg-white rounded-full h-2 transition-all"
                  style={{
                    width: `${
                      stats.totalAdvances > 0
                        ? Math.min(
                            (stats.totalExpenses / stats.totalAdvances) * 100,
                            100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Advance Form */}
        {showAdvanceForm && (
          <Card className="mb-8 border-2 border-emerald-200 shadow-lg">
            <CardHeader className="bg-emerald-50">
              <CardTitle className="flex items-center gap-2 text-emerald-900">
                <CreditCard className="h-5 w-5" />
                Give Advance
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={submitAdvance} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="advanceDate">Date *</Label>
                    <Input
                      id="advanceDate"
                      type="date"
                      value={advanceForm.date}
                      onChange={(e) =>
                        setAdvanceForm((p) => ({ ...p, date: e.target.value }))
                      }
                      required
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="advanceAmount">Amount *</Label>
                    <Input
                      id="advanceAmount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={advanceForm.amount}
                      onChange={(e) =>
                        setAdvanceForm((p) => ({ ...p, amount: e.target.value }))
                      }
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="advanceMethod">Payment Method</Label>
                    <select
                      id="advanceMethod"
                      className="w-full h-10 border rounded-md px-3 text-sm"
                      value={advanceForm.method}
                      onChange={(e) =>
                        setAdvanceForm((p) => ({ ...p, method: e.target.value }))
                      }
                      disabled={submitting}
                    >
                      <option value="cash">Cash</option>
                      <option value="bank">Bank Transfer</option>
                      <option value="mfs">Mobile Banking (bKash/Nagad)</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="advanceRef">Reference Number</Label>
                    <Input
                      id="advanceRef"
                      placeholder="TRX12345 or Check number"
                      value={advanceForm.ref}
                      onChange={(e) =>
                        setAdvanceForm((p) => ({ ...p, ref: e.target.value }))
                      }
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="advancePurpose">Purpose</Label>
                  <Input
                    id="advancePurpose"
                    placeholder="Material purchase, labor payment, etc."
                    value={advanceForm.purpose}
                    onChange={(e) =>
                      setAdvanceForm((p) => ({ ...p, purpose: e.target.value }))
                    }
                    disabled={submitting}
                  />
                </div>

                <div>
                  <Label htmlFor="advanceNotes">Notes</Label>
                  <textarea
                    id="advanceNotes"
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    rows={2}
                    placeholder="Additional notes..."
                    value={advanceForm.notes}
                    onChange={(e) =>
                      setAdvanceForm((p) => ({ ...p, notes: e.target.value }))
                    }
                    disabled={submitting}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {submitting ? "Processing..." : "Give Advance"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAdvanceForm(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Expense Form */}
        {showExpenseForm && (
          <Card className="mb-8 border-2 border-red-200 shadow-lg">
            <CardHeader className="bg-red-50">
              <CardTitle className="flex items-center gap-2 text-red-900">
                <Receipt className="h-5 w-5" />
                Record Expense
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={submitExpense} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expenseDate">Date *</Label>
                    <Input
                      id="expenseDate"
                      type="date"
                      value={expenseForm.date}
                      onChange={(e) =>
                        setExpenseForm((p) => ({ ...p, date: e.target.value }))
                      }
                      required
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="expenseAmount">Amount *</Label>
                    <Input
                      id="expenseAmount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={expenseForm.amount}
                      onChange={(e) =>
                        setExpenseForm((p) => ({ ...p, amount: e.target.value }))
                      }
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="expenseDescription">Description *</Label>
                  <Input
                    id="expenseDescription"
                    placeholder="What was purchased or paid for"
                    value={expenseForm.description}
                    onChange={(e) =>
                      setExpenseForm((p) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                    required
                    disabled={submitting}
                  />
                </div>

                <div>
                  <Label htmlFor="expenseNotes">Notes</Label>
                  <textarea
                    id="expenseNotes"
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    rows={2}
                    placeholder="Additional details..."
                    value={expenseForm.notes}
                    onChange={(e) =>
                      setExpenseForm((p) => ({ ...p, notes: e.target.value }))
                    }
                    disabled={submitting}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Processing..." : "Record Expense"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowExpenseForm(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Transactions Table */}
        <Card className="shadow-lg">
          <CardHeader className="border-b bg-white">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-slate-600" />
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {transactions.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No transactions yet</p>
                <p className="text-sm mt-1">Start by giving an advance or recording an expense</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                        Description
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                        Method
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-emerald-600 uppercase">
                        Credit (+)
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-red-600 uppercase">
                        Debit (-)
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-blue-600 uppercase">
                        Balance
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-slate-600 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {transactions.map((txn: any) => (
                      <tr key={txn.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-slate-900 whitespace-nowrap">
                          {formatDate(txn.date)}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-900">
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                  txn.type === "advance"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {txn.type === "advance" ? (
                                  <TrendingUp className="h-3 w-3" />
                                ) : (
                                  <TrendingDown className="h-3 w-3" />
                                )}
                                {txn.type === "advance" ? "Advance" : "Expense"}
                              </span>
                              <p className="font-medium">{txn.description}</p>
                            </div>
                            {txn.notes && (
                              <p className="text-xs text-slate-500 mt-1">
                                Note: {txn.notes}
                              </p>
                            )}
                            {txn.payment_ref && (
                              <p className="text-xs text-slate-500 mt-0.5">
                                Ref: {txn.payment_ref}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 capitalize whitespace-nowrap">
                          {txn.payment_method || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-right text-emerald-600 whitespace-nowrap">
                          {txn.type === "advance" ? formatCurrency(txn.amount) : "-"}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-right text-red-600 whitespace-nowrap">
                          {txn.type === "expense" ? formatCurrency(txn.amount) : "-"}
                        </td>
                        <td className={`px-4 py-3 text-sm font-bold text-right whitespace-nowrap ${
                          txn.balance > 0
                            ? "text-blue-600"
                            : txn.balance < 0
                            ? "text-orange-600"
                            : "text-slate-600"
                        }`}>
                          {formatCurrency(Math.abs(txn.balance))}
                          {txn.balance < 0 && (
                            <span className="text-xs text-orange-500 ml-1">Dr</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <EntryActions
                            entryId={txn.id}
                            tableName={txn.type === "advance" ? "person_advances" : "person_expenses"}
                            editUrl={
                              txn.type === "advance"
                                ? `/tender/${params.tenderId}/advances/edit/${txn.id}`
                                : `/tender/${params.tenderId}/expenses/edit/${txn.id}`
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
