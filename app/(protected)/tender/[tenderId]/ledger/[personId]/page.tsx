import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { labels } from "@/lib/utils/bangla";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export default async function PersonLedgerPage({
  params,
}: {
  params: { tenderId: string; personId: string };
}) {
  const supabase = createClient();

  // Get person info
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", params.personId)
    .maybeSingle();

  const { data: person } = await supabase
    .from("persons")
    .select("full_name")
    .eq("id", params.personId)
    .maybeSingle();

  // Get role from tender assignment
  const { data: assignment } = await supabase
    .from("tender_assignments")
    .select("role")
    .eq("tender_id", params.tenderId)
    .or(`user_id.eq.${params.personId},person_id.eq.${params.personId}`)
    .maybeSingle();

  // Get advances
  const { data: advances } = await supabase
    .from("advances")
    .select("*")
    .eq("tender_id", params.tenderId)
    .or(`user_id.eq.${params.personId},person_id.eq.${params.personId}`)
    .order("advance_date", { ascending: true });

  // Get expenses
  const { data: expenses } = await supabase
    .from("expense_submissions")
    .select(
      `
      *,
      expense_categories (name_bn)
    `
    )
    .eq("tender_id", params.tenderId)
    .or(`submitted_by.eq.${params.personId},person_id.eq.${params.personId}`)
    .order("expense_date", { ascending: true });

  const personName = profile?.full_name || person?.full_name || "Unknown";

  // Combine and sort by date
  const timeline: any[] = [];

  advances?.forEach((adv) => {
    timeline.push({
      date: adv.advance_date,
      type: "advance",
      description: adv.purpose,
      amount: adv.amount,
      status: null,
      data: adv,
    });
  });

  expenses?.forEach((exp) => {
    timeline.push({
      date: exp.expense_date,
      type: "expense",
      description: exp.description,
      amount: -exp.amount,
      status: exp.status,
      data: exp,
    });
  });

  timeline.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Calculate running balance
  let runningBalance = 0;
  timeline.forEach((item) => {
    if (item.type === "advance") {
      runningBalance += item.amount;
    } else if (item.type === "expense" && item.status === "approved") {
      runningBalance += item.amount; // amount is already negative
    }
    item.balance = runningBalance;
  });

  const totalAdvances =
    advances?.reduce((sum, a) => sum + Number(a.amount || 0), 0) || 0;
  const totalExpenses =
    expenses
      ?.filter((e) => e.status === "approved")
      .reduce((sum, e) => sum + Number(e.amount || 0), 0) || 0;
  const currentBalance = totalAdvances - totalExpenses;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Link
            href={`/tender/${params.tenderId}/advances`}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            ← অগ্রিম তালিকা
          </Link>
        </div>

        {/* Header Card */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-2">
                {personName}
              </h1>
              <p className="text-gray-600 mb-4">{assignment?.role}</p>
              <div
                className={`text-4xl font-bold ${
                  currentBalance > 0
                    ? "text-green-600"
                    : currentBalance < 0
                    ? "text-red-600"
                    : "text-gray-600"
                }`}
              >
                {formatCurrency(Math.abs(currentBalance))}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {currentBalance > 0
                  ? "বাকি আছে"
                  : currentBalance < 0
                  ? "পাওনা আছে"
                  : "সমান"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                মোট অগ্রিম
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-green-600">
                {formatCurrency(totalAdvances)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                মোট খরচ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-red-600">
                {formatCurrency(totalExpenses)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                ব্যালেন্স
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-xl font-bold ${
                  currentBalance > 0
                    ? "text-green-600"
                    : currentBalance < 0
                    ? "text-red-600"
                    : "text-gray-600"
                }`}
              >
                {formatCurrency(Math.abs(currentBalance))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>লেনদেন ইতিহাস</CardTitle>
          </CardHeader>
          <CardContent>
            {timeline.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">কোন লেনদেন নেই</p>
              </div>
            ) : (
              <div className="space-y-4">
                {timeline.map((item, idx) => (
                  <div
                    key={idx}
                    className="border-l-4 border-gray-300 pl-4 pb-4 relative"
                  >
                    <div
                      className={`absolute -left-2 top-0 w-4 h-4 rounded-full ${
                        item.type === "advance" ? "bg-green-500" : "bg-blue-500"
                      }`}
                    />
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              item.type === "advance"
                                ? "bg-green-100 text-green-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {item.type === "advance" ? "অগ্রিম" : "খরচ"}
                          </span>
                          {item.status && (
                            <span
                              className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                item.status === "approved"
                                  ? "bg-green-100 text-green-800"
                                  : item.status === "rejected"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {item.status === "approved"
                                ? labels.approved
                                : item.status === "rejected"
                                ? labels.rejected
                                : labels.pending}
                            </span>
                          )}
                        </div>
                        <p className="font-medium">{item.description}</p>
                        <p className="text-sm text-gray-600">
                          {formatDate(item.date)}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p
                          className={`text-lg font-bold ${
                            item.type === "advance"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {item.type === "advance" ? "+" : "-"}
                          {formatCurrency(Math.abs(item.amount))}
                        </p>
                        <p className="text-sm text-gray-600">
                          ব্যালেন্স: {formatCurrency(item.balance)}
                        </p>
                      </div>
                    </div>
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
