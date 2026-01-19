import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export default async function SubcontractorDetailPage({
  params,
}: {
  params: { tenderId: string; subId: string };
}) {
  const supabase = createClient();

  const { data: subcontractor } = await supabase
    .from("subcontractors")
    .select("*")
    .eq("tender_id", params.tenderId)
    .eq("id", params.subId)
    .single();

  if (!subcontractor) {
    return (
      <div className="p-8">
        <Link
          href={`/tender/${params.tenderId}/labor/subcontractors`}
          className="text-blue-600 hover:underline text-sm"
        >
          Back to subcontractors
        </Link>
        <p className="mt-4 text-red-600">Subcontractor not found.</p>
      </div>
    );
  }

  const { data: laborEntries } = await supabase
    .from("labor_entries")
    .select(
      `
      id,
      entry_date,
      crew_name,
      labor_name,
      labor_type,
      khoraki_total,
      wage_total,
      work_types!inner (name_bn)
    `
    )
    .eq("tender_id", params.tenderId)
    .eq("subcontractor_id", params.subId)
    .order("entry_date", { ascending: false });

  // Get advances given to this subcontractor by matching person name
  const { data: advances } = await supabase
    .from("person_advances")
    .select(`
      amount,
      advance_date,
      payment_method,
      person_id,
      persons!person_advances_person_id_fkey (full_name)
    `)
    .eq("tender_id", params.tenderId);

  // Filter advances for this subcontractor by name match
  const subAdvances = advances?.filter((adv: any) => 
    adv.persons?.full_name?.toLowerCase() === subcontractor.name.toLowerCase()
  ) || [];

  const calcBase = (entry: any) =>
    Number(entry.khoraki_total || 0) + Number(entry.wage_total || 0);
  const laborTotal = laborEntries?.reduce((s, e) => s + calcBase(e), 0) || 0;
  
  // Calculate advances and MFS charges
  let advancesTotal = 0;
  let mfsChargesTotal = 0;
  
  subAdvances.forEach((adv: any) => {
    const amount = Number(adv.amount || 0);
    advancesTotal += amount;
    if (adv.payment_method === "mfs") {
      mfsChargesTotal += amount * 0.0185 + 10;
    }
  });

  const totalCost = laborTotal + advancesTotal + mfsChargesTotal;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Link
              href={`/tender/${params.tenderId}/labor/subcontractors`}
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
            >
              <span className="text-base">←</span>
              Back to subcontractors
            </Link>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                Subcontractor
              </p>
              <h1 className="text-3xl font-bold text-gray-900">
                {subcontractor.name}
              </h1>
              {subcontractor.phone ? (
                <p className="text-sm text-gray-600">{subcontractor.phone}</p>
              ) : null}
              {subcontractor.notes ? (
                <p className="text-sm text-gray-600">{subcontractor.notes}</p>
              ) : null}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-700">
                  Labor Work
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-blue-900">
                  {formatCurrency(laborTotal)}
                </div>
                <p className="text-xs text-blue-600">
                  {laborEntries?.length || 0} entries
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-700">
                  Advances Given
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-green-900">
                  {formatCurrency(advancesTotal)}
                </div>
                <p className="text-xs text-green-600">
                  {subAdvances.length} payments
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-700">
                  MFS Charges
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-orange-900">
                  {formatCurrency(mfsChargesTotal)}
                </div>
                <p className="text-xs text-orange-600">
                  Your cost
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-700">
                  Total Your Cost
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-purple-900">
                  {formatCurrency(totalCost)}
                </div>
                <p className="text-xs text-purple-600">
                  All inclusive
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="flex justify-end">
            <Button
              asChild
              variant="outline"
              className="shadow-sm"
            >
              <Link
                href={`/tender/${params.tenderId}/labor/add?subcontractorId=${params.subId}`}
              >
                + Add labor
              </Link>
            </Button>
          </div>
        </header>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Entries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!laborEntries || laborEntries.length === 0 ? (
              <p className="text-sm text-gray-500">No labor entries yet.</p>
            ) : (
              laborEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 hover:border-blue-200 hover:shadow-sm transition"
                >
                  <div className="space-y-1">
                    <div className="text-xs text-gray-500">
                      {formatDate(entry.entry_date)} ·{" "}
                      {entry.labor_type === "contract" ? "Contract" : "Daily"}
                    </div>
                    <div className="text-sm font-medium text-gray-800">
                      {entry.crew_name ||
                        entry.labor_name ||
                        "Unnamed crew"}
                    </div>
                    {(entry.work_types as any)?.name_bn && (
                      <div className="text-xs text-gray-500">
                        {(entry.work_types as any).name_bn}
                      </div>
                    )}
                  </div>
                  <div className="text-right text-lg font-semibold text-blue-600">
                    {formatCurrency(calcBase(entry))}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
