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
import MFSChargeCalculator from "@/components/MFSChargeCalculator";

type PersonInfo = {
  name: string;
  role: string | null;
  isUser: boolean;
};

type Transaction = {
  id: string;
  date: string;
  type: "advance" | "expense" | "mfs_charge";
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
  const [mfsCharges, setMfsCharges] = useState<any[]>([]);
  const [error, setError] = useState("");

  const [showAdvanceForm, setShowAdvanceForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showBulkExpenseForm, setShowBulkExpenseForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [includeMfsCharge, setIncludeMfsCharge] = useState(false);
  const [mfsCharge, setMfsCharge] = useState(0);
  const [totalWithCharge, setTotalWithCharge] = useState(0);
  const [allPeople, setAllPeople] = useState<any[]>([]);

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

  const [transferForm, setTransferForm] = useState({
    date: new Date().toISOString().split("T")[0],
    toPersonId: "",
    toPersonType: "",
    amount: "",
    reference: "",
    notes: "",
  });

  const [bulkExpenseDate, setBulkExpenseDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [bulkExpenseItems, setBulkExpenseItems] = useState<
    Array<{ description: string; amount: string; notes: string }>
  >([{ description: "", amount: "", notes: "" }]);

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

    // Add MFS charges as separate transaction type
    const mfsTxn: Transaction[] = mfsCharges.map((c) => ({
      id: c.id,
      date: c.expense_date,
      type: "mfs_charge" as const,
      amount: Number(c.amount),
      description: c.description || "MFS Transaction Charge",
      payment_method: "mfs",
      notes: c.notes,
      isImplied: c.isImplied, // Track if this is a calculated charge
    } as any));

    // Sort by date (oldest first) to calculate running balance
    const sorted = [...advTxn, ...expTxn, ...mfsTxn].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    // Calculate running balance for each transaction
    // MFS charges do NOT affect the person's balance
    let runningBalance = 0;
    const withBalance = sorted.map((txn) => {
      if (txn.type === "advance") {
        runningBalance += txn.amount;
      } else if (txn.type === "expense") {
        // Only regular expenses deduct from balance, NOT MFS charges
        runningBalance -= txn.amount;
      }
      // MFS charges don't change the balance
      return {
        ...txn,
        balance: runningBalance,
      };
    });

    // Return in reverse order (newest first) for display
    return withBalance.reverse();
  }, [advances, expenses, mfsCharges]);

  const stats = useMemo(() => {
    const totalAdvances = advances.reduce(
      (sum, a) => sum + Number(a.amount || 0),
      0,
    );
    const totalExpenses = expenses.reduce(
      (sum, e) => sum + Number(e.amount || 0),
      0,
    );
    const totalMfsCharges = mfsCharges.reduce(
      (sum, c) => sum + Number(c.amount || 0),
      0,
    );
    const balance = totalAdvances - totalExpenses; // MFS charges don't affect person's balance
    const actualCost = totalAdvances + totalMfsCharges; // Your actual cost including MFS
    return {
      totalAdvances,
      totalExpenses, // Only person expenses, not MFS charges
      totalMfsCharges,
      actualCost,
      balance,
      advanceCount: advances.length,
      expenseCount: expenses.length,
      mfsChargeCount: mfsCharges.length,
    };
  }, [advances, expenses, mfsCharges]);

  useEffect(() => {
    loadAll();
    loadAllPeople();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAllPeople = async () => {
    // Load all people/users assigned to this tender (except current person)
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

    const peopleList: any[] = [];

    if (authAssignments) {
      authAssignments.forEach((ta: any) => {
        if (ta.profiles && ta.profiles.id !== params.personId) {
          peopleList.push({
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
        if (ta.persons && ta.persons.id !== params.personId) {
          peopleList.push({
            id: ta.persons.id,
            name: ta.persons.full_name,
            role: ta.role,
            type: "person",
          });
        }
      });
    }

    setAllPeople(peopleList);
  };

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

    // Load MFS charges related to this person's advances
    // MFS charges are stored in activity_expenses with description like "[MFS CHARGE] Advance to Person Name"
    const personName = profile?.full_name || personRow?.full_name || "";
    const { data: mfsChargeData } = await supabase
      .from("activity_expenses")
      .select("*")
      .eq("tender_id", params.tenderId)
      .like("description", `%${personName}%`)
      .like("description", "[MFS CHARGE]%")
      .order("expense_date", { ascending: false });

    // For existing MFS advances that don't have charges yet, calculate implied charges
    const existingMfsCharges: any[] = [];
    if (advanceData) {
      for (const advance of advanceData) {
        if (advance.payment_method === "mfs") {
          // Check if this advance already has a charge
          const amount = Number(advance.amount);
          const hasCharge = mfsChargeData?.some((charge) => {
            // Match by reference number (most reliable)
            if (advance.payment_ref && charge.payment_ref === advance.payment_ref) {
              return true;
            }
            // Match by description containing the exact amount
            if (charge.description?.includes(`৳${amount.toFixed(2)}`)) {
              return true;
            }
            // Match by date and similar amount (within 1% tolerance for rounding)
            const chargeDate = new Date(charge.expense_date).toDateString();
            const advanceDate = new Date(advance.advance_date).toDateString();
            const expectedCharge = (amount * 0.0185) + 10;
            const chargeDiff = Math.abs(Number(charge.amount) - expectedCharge);
            if (chargeDate === advanceDate && chargeDiff < 1) {
              return true;
            }
            return false;
          });
          
          if (!hasCharge) {
            // Calculate the implied MFS charge
            const mfsCharge = (amount * 0.0185) + 10;
            
            existingMfsCharges.push({
              id: `implied-${advance.id}`,
              expense_date: advance.advance_date,
              amount: mfsCharge,
              description: `[MFS CHARGE] Advance to ${personName} (৳${amount.toFixed(2)})`,
              notes: `Auto-calculated: 1.85% + ৳10 MFS charge (Not yet recorded in database)`,
              payment_method: "mfs",
              payment_ref: advance.payment_ref,
              isImplied: true, // Mark as implied/calculated
            });
          }
        }
      }
    }

    setAdvances(advanceData || []);
    setExpenses(expenseData || []);
    setMfsCharges([...(mfsChargeData || []), ...existingMfsCharges]);
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

      // Person advance with actual amount (not including charge)
      const actualAmount = parseFloat(advanceForm.amount || "0");

      const payload = {
        tender_id: params.tenderId,
        advance_date: advanceForm.date,
        amount: actualAmount,
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

      // If MFS charge is included, add it to activity_expenses (not person_expenses)
      // This is YOUR cost, not deducted from the person's balance
      if (advanceForm.method === "mfs" && includeMfsCharge && mfsCharge > 0) {
        const { error: chargeError } = await supabase
          .from("activity_expenses")
          .insert({
            tender_id: params.tenderId,
            expense_date: advanceForm.date,
            description: `[MFS CHARGE] Advance to ${person.name} (৳${actualAmount.toFixed(2)})`,
            amount: mfsCharge,
            payment_method: advanceForm.method,
            payment_ref: advanceForm.ref || null,
            notes: `Auto-generated: 1.85% + ৳10 MFS charge`,
            created_by: userId,
          });

        if (chargeError) {
          console.error("Failed to record MFS charge:", chargeError);
          // Don't throw - advance was successful, just log the error
        }
      }

      setAdvanceForm({
        date: new Date().toISOString().split("T")[0],
        amount: "",
        method: "cash",
        ref: "",
        purpose: "",
        notes: "",
      });
      setIncludeMfsCharge(false);
      setMfsCharge(0);
      setTotalWithCharge(0);
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

  const submitTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!person) return;

    setSubmitting(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("Not authenticated");

      const transferAmount = parseFloat(transferForm.amount || "0");
      if (transferAmount <= 0) throw new Error("Amount must be greater than 0");

      const toPersonIsUser = transferForm.toPersonType === "user";
      const toPerson = allPeople.find((p) => p.id === transferForm.toPersonId);
      if (!toPerson) throw new Error("Recipient not found");

      // 1. Deduct from current person (expense entry)
      const { error: deductError } = await supabase
        .from("person_expenses")
        .insert({
          tender_id: params.tenderId,
          expense_date: transferForm.date,
          description: `[INTERNAL TRANSFER] Transfer to ${toPerson.name}`,
          amount: transferAmount,
          notes: transferForm.notes || `Money transferred to ${toPerson.name}`,
          created_by: userId,
          user_id: person.isUser ? params.personId : null,
          person_id: person.isUser ? null : params.personId,
        });

      if (deductError) throw deductError;

      // 2. Add to recipient (advance entry)
      const { error: addError } = await supabase
        .from("person_advances")
        .insert({
          tender_id: params.tenderId,
          advance_date: transferForm.date,
          amount: transferAmount,
          payment_method: "cash",
          payment_ref: transferForm.reference || `TRANSFER-${Date.now()}`,
          purpose: `Transfer from ${person.name}`,
          notes: `[INTERNAL TRANSFER] ${transferForm.notes || `Money received from ${person.name}`}`,
          created_by: userId,
          user_id: toPersonIsUser ? transferForm.toPersonId : null,
          person_id: toPersonIsUser ? null : transferForm.toPersonId,
        });

      if (addError) throw addError;

      setTransferForm({
        date: new Date().toISOString().split("T")[0],
        toPersonId: "",
        toPersonType: "",
        amount: "",
        reference: "",
        notes: "",
      });
      setShowTransferForm(false);
      loadAll();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const submitBulkExpenses = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!person) return;

    // Validate at least one item with description and amount
    const validItems = bulkExpenseItems.filter(
      (item) => item.description.trim() && parseFloat(item.amount || "0") > 0,
    );

    if (validItems.length === 0) {
      alert("Please add at least one expense with description and amount");
      return;
    }

    setSubmitting(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("Not authenticated");

      // Prepare all expense entries
      const expenseEntries = validItems.map((item) => ({
        tender_id: params.tenderId,
        expense_date: bulkExpenseDate,
        description: item.description.trim(),
        amount: parseFloat(item.amount),
        notes: item.notes.trim() || null,
        created_by: userId,
        user_id: person.isUser ? params.personId : null,
        person_id: person.isUser ? null : params.personId,
      }));

      // Insert all at once
      const { error: insertError } = await supabase
        .from("person_expenses")
        .insert(expenseEntries);

      if (insertError) throw insertError;

      // Reset form
      setBulkExpenseDate(new Date().toISOString().split("T")[0]);
      setBulkExpenseItems([{ description: "", amount: "", notes: "" }]);
      setShowBulkExpenseForm(false);
      loadAll();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const saveImpliedMfsCharge = async (txn: any) => {
    if (!txn.isImplied) return;
    
    setSubmitting(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("Not authenticated");

      // Save the implied charge to activity_expenses
      const { error: insertError } = await supabase
        .from("activity_expenses")
        .insert({
          tender_id: params.tenderId,
          expense_date: txn.date,
          description: txn.description,
          amount: txn.amount,
          payment_method: "mfs",
          payment_ref: txn.payment_ref || null,
          notes: `Auto-generated: 1.85% + ৳10 MFS charge`,
          created_by: userId,
        });

      if (insertError) throw insertError;

      // Update the state immediately to remove isImplied flag
      setMfsCharges((prev) => 
        prev.map((c: any) => 
          c.id === txn.id ? { ...c, isImplied: false } : c
        )
      );
    } catch (err: any) {
      alert("Error saving MFS charge: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const addBulkExpenseItem = () => {
    setBulkExpenseItems([
      ...bulkExpenseItems,
      { description: "", amount: "", notes: "" },
    ]);
  };

  const removeBulkExpenseItem = (index: number) => {
    if (bulkExpenseItems.length > 1) {
      setBulkExpenseItems(bulkExpenseItems.filter((_, i) => i !== index));
    }
  };

  const updateBulkExpenseItem = (
    index: number,
    field: "description" | "amount" | "notes",
    value: string,
  ) => {
    const updated = [...bulkExpenseItems];
    updated[index][field] = value;
    setBulkExpenseItems(updated);
  };

  const saveAllImpliedCharges = async () => {
    const impliedCharges = mfsCharges.filter((c: any) => c.isImplied);
    if (impliedCharges.length === 0) return;

    if (!confirm(`Save ${impliedCharges.length} calculated MFS charge(s) to database?`)) {
      return;
    }

    setSubmitting(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("Not authenticated");

      const entries = impliedCharges.map((charge: any) => ({
        tender_id: params.tenderId,
        expense_date: charge.expense_date,
        description: charge.description,
        amount: charge.amount,
        payment_method: "mfs",
        payment_ref: charge.payment_ref || null,
        notes: `Auto-generated: 1.85% + ৳10 MFS charge`,
        created_by: userId,
      }));

      const { error: insertError } = await supabase
        .from("activity_expenses")
        .insert(entries);

      if (insertError) throw insertError;

      // Update state to mark all as saved
      setMfsCharges((prev) => 
        prev.map((c: any) => 
          c.isImplied ? { ...c, isImplied: false } : c
        )
      );

      alert(`Successfully saved ${impliedCharges.length} MFS charge(s)`);
    } catch (err: any) {
      alert("Error saving MFS charges: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const impliedChargesCount = mfsCharges.filter((c: any) => c.isImplied).length;

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
                    <p className="text-sm text-slate-600 mt-1">{person.role}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setShowAdvanceForm(true)}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                <CreditCard className="h-4 w-4" />
                Give Advance
              </Button>
              <Button
                onClick={() => setShowBulkExpenseForm(true)}
                variant="outline"
                className="gap-2"
              >
                <Receipt className="h-4 w-4" />
                Record Expenses
              </Button>
              <Button
                onClick={() => setShowTransferForm(true)}
                variant="outline"
                className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <ArrowLeft className="h-4 w-4 rotate-180" />
                Transfer to Staff
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
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

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                MFS Charges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalMfsCharges)}
              </div>
              <p className="text-xs opacity-80 mt-1">
                {stats.mfsChargeCount} charges
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Actual Cost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.actualCost)}
              </div>
              <p className="text-xs opacity-80 mt-1">
                Including MFS
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
                {stats.balance > 0
                  ? "Remaining Balance"
                  : stats.balance < 0
                    ? "Over Spent"
                    : "Balanced"}
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
                  ? Math.round(
                      (stats.totalExpenses / stats.totalAdvances) * 100,
                    )
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
                            100,
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
                        setAdvanceForm((p) => ({
                          ...p,
                          amount: e.target.value,
                        }))
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
                        setAdvanceForm((p) => ({
                          ...p,
                          method: e.target.value,
                        }))
                      }
                      disabled={submitting}
                    >
                      <option value="cash">Cash</option>
                      <option value="bank">Bank Transfer</option>
                      <option value="mfs">Mobile Banking (bKash/Nagad)</option>
                    </select>
                  </div>

                  {advanceForm.method === "mfs" && (
                    <div className="md:col-span-2">
                      <div className="space-y-4">
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg">
                          <div className="flex items-start gap-3 mb-2">
                            <input
                              type="checkbox"
                              id="includeMfsCharge"
                              checked={includeMfsCharge}
                              onChange={(e) =>
                                setIncludeMfsCharge(e.target.checked)
                              }
                              className="w-4 h-4 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              disabled={submitting}
                            />
                            <div className="flex-1">
                              <label
                                htmlFor="includeMfsCharge"
                                className="cursor-pointer text-sm font-semibold text-gray-900 block"
                              >
                                MFS চার্জ অন্তর্ভুক্ত করুন (1.85% + ৳10)
                              </label>
                              <p className="text-xs text-gray-600 mt-1">
                                ব্যক্তি সম্পূর্ণ টাকা পাবেন। MFS চার্জ আলাদাভাবে
                                আপনার খরচ হিসেবে রেকর্ড হবে।
                              </p>
                            </div>
                          </div>
                        </div>

                        {includeMfsCharge && (
                          <MFSChargeCalculator
                            amount={advanceForm.amount}
                            paymentMethod={advanceForm.method}
                            onChargeCalculated={(charge, total) => {
                              setMfsCharge(charge);
                              setTotalWithCharge(total);
                            }}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                {/* Summary Section - Only show when MFS charge is included */}
                {advanceForm.method === "mfs" &&
                  includeMfsCharge &&
                  mfsCharge > 0 &&
                  parseFloat(advanceForm.amount) > 0 && (
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-300 rounded-lg p-4">
                      <h4 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
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
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        সারসংক্ষেপ
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center p-2 bg-white rounded">
                          <span className="text-gray-700">
                            ব্যক্তি যা পাবেন:
                          </span>
                          <span className="font-bold text-green-600 text-lg">
                            ৳{parseFloat(advanceForm.amount).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-white rounded">
                          <span className="text-gray-700">MFS চার্জ:</span>
                          <span className="font-semibold text-orange-600">
                            ৳{mfsCharge.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-indigo-100 rounded border-2 border-indigo-400">
                          <span className="font-bold text-indigo-900">
                            আপনার মোট খরচ:
                          </span>
                          <span className="font-bold text-indigo-900 text-xl">
                            ৳{totalWithCharge.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

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
                        setExpenseForm((p) => ({
                          ...p,
                          amount: e.target.value,
                        }))
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

        {/* Transfer Form */}
        {showTransferForm && (
          <Card className="mb-8 shadow-lg border-blue-200">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <ArrowLeft className="h-5 w-5 rotate-180" />
                Transfer to Another Staff
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={submitTransfer} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="transferDate">Date *</Label>
                    <Input
                      id="transferDate"
                      type="date"
                      value={transferForm.date}
                      onChange={(e) =>
                        setTransferForm((p) => ({ ...p, date: e.target.value }))
                      }
                      required
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="transferAmount">Amount *</Label>
                    <Input
                      id="transferAmount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={transferForm.amount}
                      onChange={(e) =>
                        setTransferForm((p) => ({
                          ...p,
                          amount: e.target.value,
                        }))
                      }
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="transferTo">Transfer To *</Label>
                  <select
                    id="transferTo"
                    className="w-full h-10 border rounded-md px-3 text-sm"
                    value={
                      transferForm.toPersonId
                        ? `${transferForm.toPersonType}:${transferForm.toPersonId}`
                        : ""
                    }
                    onChange={(e) => {
                      const [type, id] = e.target.value.split(":");
                      setTransferForm((p) => ({
                        ...p,
                        toPersonId: id || "",
                        toPersonType: type || "",
                      }));
                    }}
                    required
                    disabled={submitting}
                  >
                    <option value="">Select person...</option>
                    {allPeople.map((person) => (
                      <option
                        key={`${person.type}:${person.id}`}
                        value={`${person.type}:${person.id}`}
                      >
                        {person.name} ({person.role})
                      </option>
                    ))}
                  </select>
                  {allPeople.length === 0 && (
                    <p className="text-sm text-amber-600 mt-1">
                      No other staff members available for transfer
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="transferReference">Reference</Label>
                  <Input
                    id="transferReference"
                    placeholder="Transaction reference (optional)"
                    value={transferForm.reference}
                    onChange={(e) =>
                      setTransferForm((p) => ({
                        ...p,
                        reference: e.target.value,
                      }))
                    }
                    disabled={submitting}
                  />
                </div>

                <div>
                  <Label htmlFor="transferNotes">Notes</Label>
                  <textarea
                    id="transferNotes"
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    rows={2}
                    placeholder="Reason for transfer..."
                    value={transferForm.notes}
                    onChange={(e) =>
                      setTransferForm((p) => ({ ...p, notes: e.target.value }))
                    }
                    disabled={submitting}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={submitting || allPeople.length === 0}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {submitting ? "Processing..." : "Transfer Money"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowTransferForm(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Bulk Expense Form */}
        {showBulkExpenseForm && (
          <Card className="mb-8 shadow-lg border-gray-200">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Receipt className="h-5 w-5" />
                Record Expenses
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={submitBulkExpenses} className="space-y-6">
                <div>
                  <Label htmlFor="bulkExpenseDate">Date *</Label>
                  <Input
                    id="bulkExpenseDate"
                    type="date"
                    value={bulkExpenseDate}
                    onChange={(e) => setBulkExpenseDate(e.target.value)}
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900">
                      Expense Items
                    </h4>
                    <Button
                      type="button"
                      onClick={addBulkExpenseItem}
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      disabled={submitting}
                    >
                      <Plus className="h-4 w-4" />
                      Add Item
                    </Button>
                  </div>

                  {bulkExpenseItems.map((item, index) => (
                    <div
                      key={index}
                      className="border-2 border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="font-medium text-gray-700">
                          Item #{index + 1}
                        </h5>
                        {bulkExpenseItems.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removeBulkExpenseItem(index)}
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={submitting}
                          >
                            Remove
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor={`desc-${index}`}>Description *</Label>
                          <Input
                            id={`desc-${index}`}
                            placeholder="What was purchased or paid for"
                            value={item.description}
                            onChange={(e) =>
                              updateBulkExpenseItem(
                                index,
                                "description",
                                e.target.value,
                              )
                            }
                            disabled={submitting}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`amount-${index}`}>Amount *</Label>
                          <Input
                            id={`amount-${index}`}
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={item.amount}
                            onChange={(e) =>
                              updateBulkExpenseItem(
                                index,
                                "amount",
                                e.target.value,
                              )
                            }
                            disabled={submitting}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor={`notes-${index}`}>Notes</Label>
                        <Input
                          id={`notes-${index}`}
                          placeholder="Additional details..."
                          value={item.notes}
                          onChange={(e) =>
                            updateBulkExpenseItem(
                              index,
                              "notes",
                              e.target.value,
                            )
                          }
                          disabled={submitting}
                        />
                      </div>
                    </div>
                  ))}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-900 font-medium">
                      Total Amount: ৳
                      {bulkExpenseItems
                        .reduce(
                          (sum, item) => sum + (parseFloat(item.amount) || 0),
                          0,
                        )
                        .toFixed(2)}
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      {
                        bulkExpenseItems.filter(
                          (item) =>
                            item.description.trim() &&
                            parseFloat(item.amount || "0") > 0,
                        ).length
                      }{" "}
                      valid expense(s)
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-gray-900 hover:bg-gray-800"
                  >
                    {submitting ? "Processing..." : "Record Expenses"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowBulkExpenseForm(false)}
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-slate-600" />
                  Transaction History
                </CardTitle>
                <p className="text-xs text-slate-600 mt-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-xs font-medium mr-2">
                    <CreditCard className="h-3 w-3" />
                    MFS Charges
                  </span>
                  are your transaction costs (1.85% + ৳10) and do not affect the person's balance.
                </p>
              </div>
              {impliedChargesCount > 0 && (
                <Button
                  onClick={saveAllImpliedCharges}
                  disabled={submitting}
                  size="sm"
                  className="gap-2 bg-orange-500 hover:bg-orange-600"
                >
                  <CreditCard className="h-4 w-4" />
                  Save {impliedChargesCount} Calculated Charge{impliedChargesCount > 1 ? 's' : ''}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {transactions.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No transactions yet</p>
                <p className="text-sm mt-1">
                  Start by giving an advance or recording an expense
                </p>
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
                      <tr
                        key={txn.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
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
                                    : txn.type === "mfs_charge"
                                      ? (txn as any).isImplied 
                                        ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                                        : "bg-orange-100 text-orange-800"
                                      : "bg-red-100 text-red-800"
                                }`}
                              >
                                {txn.type === "advance" ? (
                                  <TrendingUp className="h-3 w-3" />
                                ) : txn.type === "mfs_charge" ? (
                                  <CreditCard className="h-3 w-3" />
                                ) : (
                                  <TrendingDown className="h-3 w-3" />
                                )}
                                {txn.type === "advance"
                                  ? "Advance"
                                  : txn.type === "mfs_charge"
                                    ? (txn as any).isImplied ? "MFS Charge (Calculated)" : "MFS Charge"
                                    : "Expense"}
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
                          {txn.type === "advance"
                            ? formatCurrency(txn.amount)
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-right text-red-600 whitespace-nowrap">
                          {txn.type === "expense"
                            ? formatCurrency(txn.amount)
                            : txn.type === "mfs_charge"
                              ? <span className="text-orange-600">{formatCurrency(txn.amount)}</span>
                              : "-"}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm font-bold text-right whitespace-nowrap ${
                            txn.balance > 0
                              ? "text-blue-600"
                              : txn.balance < 0
                                ? "text-orange-600"
                                : "text-slate-600"
                          }`}
                        >
                          {formatCurrency(Math.abs(txn.balance))}
                          {txn.balance < 0 && (
                            <span className="text-xs text-orange-500 ml-1">
                              Dr
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {txn.type === "mfs_charge" ? (
                            (txn as any).isImplied ? (
                              <Button
                                onClick={() => saveImpliedMfsCharge(txn)}
                                disabled={submitting}
                                size="sm"
                                className="text-xs bg-orange-500 hover:bg-orange-600"
                              >
                                {submitting ? "Saving..." : "Save to DB"}
                              </Button>
                            ) : (
                              <span className="text-xs text-slate-500 italic">Auto-generated</span>
                            )
                          ) : (
                            <EntryActions
                              entryId={txn.id}
                              tableName={
                                txn.type === "advance"
                                  ? "person_advances"
                                  : "person_expenses"
                              }
                              editUrl={
                                txn.type === "advance"
                                  ? `/tender/${params.tenderId}/advances/edit/${txn.id}`
                                  : `/tender/${params.tenderId}/expenses/edit/${txn.id}`
                              }
                            />
                          )}
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
