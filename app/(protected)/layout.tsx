import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: assignments } = await supabase
    .from("tender_assignments")
    .select(
      `
      *,
      tenders (
        id,
        tender_code,
        project_name,
        is_active
      )
    `
    )
    .eq("user_id", user.id);

  const tenders = assignments?.map((a) => a.tenders).filter(Boolean) || [];

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <Sidebar tenders={tenders as any} userRole={profile?.role || "user"} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
