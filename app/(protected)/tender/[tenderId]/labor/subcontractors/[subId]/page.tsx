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

  const calcBase = (entry: any) =>
    Number(entry.khoraki_total || 0) + Number(entry.wage_total || 0);
  const total = laborEntries?.reduce((s, e) => s + calcBase(e), 0) || 0;

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
          <div className="flex flex-col items-end gap-2">
            <Card className="bg-gradient-to-br from-white via-slate-50 to-slate-100 border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">
                  Total labor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-gray-900">
                  {formatCurrency(total)}
                </div>
                <p className="text-xs text-gray-500">
                  {laborEntries?.length || 0} entries
                </p>
              </CardContent>
            </Card>
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
