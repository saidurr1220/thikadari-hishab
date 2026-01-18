import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/format";
import {
  ArrowLeft,
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  User,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PeopleAdvanceHubPage({
  params,
}: {
  params: { tenderId: string };
}) {
  const supabase = createClient();

  // Get all person advances for this tender
  const { data: personAdvances } = await supabase
    .from("person_advances")
    .select(`
      *,
      person:persons!person_advances_person_id_fkey (id, full_name, role)
    `)
    .eq("tender_id", params.tenderId)
    .order("advance_date", { ascending: false });

  // Get all person expenses for this tender
  const { data: personExpenses } = await supabase
    .from("person_expenses")
    .select(`
      *,
      person:persons!person_expenses_person_id_fkey (id, full_name, role)
    `)
    .eq("tender_id", params.tenderId);

  // Calculate balances per person
  const balanceMap = new Map();

  personAdvances?.forEach((adv: any) => {
    const personId = adv.person_id;
    const personName = adv.person?.full_name || "Unknown";
    const role = adv.person?.role || "";
    
    if (!balanceMap.has(personId)) {
      balanceMap.set(personId, {
        person_id: personId,
        person_name: personName,
        role: role,
        total_advances: 0,
        total_expenses: 0,
        balance: 0,
      });
    }
    
    const balance = balanceMap.get(personId);
    balance.total_advances += Number(adv.amount || 0);
    balance.balance += Number(adv.amount || 0);
  });

  personExpenses?.forEach((exp: any) => {
    const personId = exp.person_id;
    const personName = exp.person?.full_name || "Unknown";
    const role = exp.person?.role || "";
    
    if (!balanceMap.has(personId)) {
      balanceMap.set(personId, {
        person_id: personId,
        person_name: personName,
        role: role,
        total_advances: 0,
        total_expenses: 0,
        balance: 0,
      });
    }
    
    const balance = balanceMap.get(personId);
    balance.total_expenses += Number(exp.amount || 0);
    balance.balance -= Number(exp.amount || 0);
  });

  const balances = Array.from(balanceMap.values());

  const totalAdvances = balances?.reduce(
    (sum: number, b: any) => sum + Number(b.total_advances || 0),
    0
  ) || 0;

  const totalExpenses = balances?.reduce(
    (sum: number, b: any) => sum + Number(b.total_expenses || 0),
    0
  ) || 0;

  const netBalance = totalAdvances - totalExpenses;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(167,243,208,0.4),rgba(255,255,255,0))]">
      <div className="bg-gradient-to-br from-emerald-50 via-white to-slate-50 py-4 sm:py-6 md:py-8">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 space-y-4 sm:space-y-6">
          <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
            <div className="text-center md:text-left">
              <Link
                href={`/tender/${params.tenderId}`}
                className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                Back to tender dashboard
              </Link>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 flex items-center justify-center md:justify-start gap-2 sm:gap-3">
                <Users className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-emerald-600" />
                Staff & Workers
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Manage advances and expenses for all staff members
              </p>
            </div>
            <Link href={`/tender/${params.tenderId}/advances/give`}>
              <Button className="gap-1.5 sm:gap-2 bg-emerald-600 hover:bg-emerald-700 text-xs sm:text-sm h-8 sm:h-9 md:h-10 w-full sm:w-auto px-2.5 sm:px-3 md:px-4">
                <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Add Person</span>
                <span className="xs:hidden">Add</span>
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            <Card className="bg-white/80 border-slate-200/70 shadow-sm">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-xs sm:text-sm font-medium text-slate-500 flex items-center gap-1.5 sm:gap-2">
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Total Advances</span>
                  <span className="xs:hidden">Advances</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-emerald-600 break-all">
                  {formatCurrency(totalAdvances)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 border-slate-200/70 shadow-sm">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-xs sm:text-sm font-medium text-slate-500 flex items-center gap-1.5 sm:gap-2">
                  <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Total Expenses</span>
                  <span className="xs:hidden">Expenses</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-red-600 break-all">
                  {formatCurrency(totalExpenses)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 border-slate-200/70 shadow-sm">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-xs sm:text-sm font-medium text-slate-500 flex items-center gap-1.5 sm:gap-2">
                  <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Net Balance</span>
                  <span className="xs:hidden">Balance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-lg sm:text-xl md:text-2xl font-bold break-all ${
                    netBalance > 0
                      ? "text-blue-600"
                      : netBalance < 0
                      ? "text-orange-600"
                      : "text-slate-600"
                  }`}
                >
                  {formatCurrency(Math.abs(netBalance))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 border-slate-200/70 shadow-sm">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-xs sm:text-sm font-medium text-slate-500 flex items-center gap-1.5 sm:gap-2">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Total People</span>
                  <span className="xs:hidden">People</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">
                  {balances?.length || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white/80 border-slate-200/70 shadow-sm">
            <CardHeader className="border-b bg-white/50">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-slate-600" />
                People
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {!balances || balances.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                  <Users className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-medium">No staff members yet</p>
                  <p className="text-sm mt-2">
                    Start by giving an advance to someone
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {balances.map((bal: any) => {
                    const showBalance = bal.balance > 0;
                    const displayAmount = showBalance
                      ? bal.balance
                      : Math.abs(bal.balance);

                    return (
                      <Link
                        key={bal.person_id}
                        href={`/tender/${params.tenderId}/advances/people/${bal.person_id}`}
                      >
                        <div className="border border-slate-200 rounded-lg p-3 sm:p-4 bg-white group hover:shadow-md hover:border-emerald-300 transition-all">
                          <div className="flex flex-col xs:flex-row items-start xs:items-start xs:justify-between gap-3">
                            <div className="flex items-center gap-2 sm:gap-3 flex-1 w-full">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center flex-shrink-0">
                                <User className="h-5 w-5 text-emerald-700" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-base sm:text-lg text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                                  {bal.person_name}
                                </p>
                                {bal.role && (
                                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                                    {bal.role}
                                  </p>
                                )}
                                <div className="flex flex-wrap gap-2 sm:gap-3 mt-1.5 sm:mt-2 text-xs text-slate-600">
                                  <span className="flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3 text-emerald-600" />
                                    {formatCurrency(bal.total_advances)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <TrendingDown className="h-3 w-3 text-red-600" />
                                    {formatCurrency(bal.total_expenses)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-left xs:text-right flex-shrink-0 w-full xs:w-auto">
                              <p
                                className={`text-lg sm:text-xl font-bold ${
                                  bal.balance > 0
                                    ? "text-blue-600"
                                    : bal.balance < 0
                                    ? "text-orange-600"
                                    : "text-slate-600"
                                }`}
                              >
                                {formatCurrency(Math.abs(bal.balance))}
                              </p>
                              <p
                                className={`text-xs font-medium mt-1 px-2 py-0.5 rounded-full inline-block ${
                                  bal.balance > 0
                                    ? "bg-blue-100 text-blue-700"
                                    : bal.balance < 0
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {bal.balance > 0
                                  ? "Has balance"
                                  : bal.balance < 0
                                  ? "Over spent"
                                  : "Settled"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
