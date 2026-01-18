import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { labels } from "@/lib/utils/bangla";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import EntryActions from "@/components/EntryActions";

export const dynamic = "force-dynamic";

export default async function AdvancesListPage({
  params,
}: {
  params: { tenderId: string };
}) {
  const supabase = createClient();

  const { data: advances } = await supabase
    .from("person_advances")
    .select(
      `
      *,
      user:profiles!person_advances_user_id_fkey (full_name),
      person:persons!person_advances_person_id_fkey (full_name)
    `
    )
    .eq("tender_id", params.tenderId)
    .order("advance_date", { ascending: false })
    .limit(50);

  const total =
    advances?.reduce((sum, a) => sum + Number(a.amount || 0), 0) || 0;

  // Get person-wise balances
  const { data: balances } = await supabase.rpc("get_person_balances", {
    p_tender_id: params.tenderId,
  });

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
              {labels.advanceLedger}
            </h1>
          </div>
          <Link href={`/tender/${params.tenderId}/advances/give`}>
            <Button>+ অগ্রিম প্রদান</Button>
          </Link>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                মোট অগ্রিম
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(total)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                মোট এন্ট্রি
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{advances?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Person Balances */}
        {balances && balances.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>ব্যক্তিভিত্তিক ব্যালেন্স</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {balances.map((bal: any) => (
                  <Link
                    key={bal.person_id}
                    href={`/tender/${params.tenderId}/ledger/${bal.person_id}`}
                  >
                    <div className="flex justify-between items-center p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                      <div>
                        <p className="font-semibold">{bal.person_name}</p>
                        <p className="text-sm text-gray-600">{bal.role}</p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-xl font-bold ${
                            bal.balance > 0
                              ? "text-green-600"
                              : bal.balance < 0
                              ? "text-red-600"
                              : "text-gray-600"
                          }`}
                        >
                          {formatCurrency(Math.abs(bal.balance))}
                        </p>
                        <p className="text-xs text-gray-600">
                          {bal.balance > 0
                            ? "বাকি"
                            : bal.balance < 0
                            ? "পাওনা"
                            : "সমান"}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Advances List */}
        <Card>
          <CardHeader>
            <CardTitle>সাম্প্রতিক অগ্রিম সমূহ</CardTitle>
          </CardHeader>
          <CardContent>
            {!advances || advances.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">কোন অগ্রিম নেই</p>
                <Link href={`/tender/${params.tenderId}/advances/give`}>
                  <Button>প্রথম অগ্রিম প্রদান করুন</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {advances.map((advance) => (
                  <div
                    key={advance.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">
                          {advance.user?.full_name ||
                            advance.person?.full_name ||
                            "Unknown"}
                        </h3>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>{formatDate(advance.advance_date)}</p>
                          <p>উদ্দেশ্য: {advance.purpose}</p>
                          <p>
                            পদ্ধতি:{" "}
                            {advance.payment_method === "cash"
                              ? labels.cash
                              : advance.payment_method === "bank"
                              ? labels.bank
                              : labels.mfs}
                          </p>
                          {advance.payment_ref && (
                            <p>রেফারেন্স: {advance.payment_ref}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-start gap-3 ml-4">
                        <div className="text-right">
                          <p className="text-xl font-bold text-green-600">
                            {formatCurrency(advance.amount)}
                          </p>
                        </div>
                        <EntryActions
                          entryId={advance.id}
                          tableName="person_advances"
                          editUrl={`/tender/${params.tenderId}/advances/edit/${advance.id}`}
                        />
                      </div>
                    </div>
                    {advance.notes && (
                      <p className="text-sm text-gray-600 mt-3 pt-3 border-t">
                        {advance.notes}
                      </p>
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
