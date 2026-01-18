import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

type SubSummary = {
  id: string | null;
  name: string;
  total: number;
  entries: number;
};

export default async function SubcontractorLaborPage({
  params,
}: {
  params: { tenderId: string };
}) {
  const supabase = createClient();

  const { data: entries } = await supabase
    .from("labor_entries")
    .select(
      `
      id,
      subcontractor_id,
      khoraki_total,
      wage_total,
      subcontractors!left (name)
    `
    )
    .eq("tender_id", params.tenderId);

  const summaries = new Map<string, SubSummary>();

  entries?.forEach((e) => {
    const key = e.subcontractor_id || "none";
    const name = (e.subcontractors as any)?.name || "Unassigned";
    const base =
      Number(e.khoraki_total || 0) + Number(e.wage_total || 0);
    if (!summaries.has(key)) {
      summaries.set(key, { id: e.subcontractor_id, name, total: 0, entries: 0 });
    }
    const current = summaries.get(key)!;
    current.total += base;
    current.entries += 1;
  });

  const list = Array.from(summaries.values()).sort((a, b) =>
    b.total - a.total
  );
  const grandTotal = list.reduce((s, it) => s + it.total, 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href={`/tender/${params.tenderId}/labor`}
            className="text-sm text-blue-600 hover:underline"
          >
            Back to labor
          </Link>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total labor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(grandTotal)}
              </div>
              <p className="text-xs text-gray-500">
                {entries?.length || 0} entries
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>By subcontractor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {list.length === 0 ? (
              <p className="text-sm text-gray-500">No labor entries yet.</p>
            ) : (
              list.map((item) => (
                <Link
                  key={item.id || "none"}
                  href={`/tender/${params.tenderId}/labor/subcontractors/${item.id || "none"}`}
                  className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-4 py-3 hover:shadow-sm transition"
                >
                  <div>
                    <div className="font-medium text-gray-900">
                      {item.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.entries} entries
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-blue-600">
                      {formatCurrency(item.total)}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
