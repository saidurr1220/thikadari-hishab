import * as XLSX from "xlsx";
import { formatCurrency, formatDate } from "./format";

// Export Daily Report to Excel
export function exportDailyReport(data: any, tender: any, date: string) {
    const wb = XLSX.utils.book_new();

    // Labor sheet
    const laborData = data.labor.map((l: any) => ({
        ধরন: l.labor_type === "contract" ? "চুক্তি" : "দৈনিক",
        বিবরণ: `${l.crew_name || l.labor_name || "-"}${l.work_types ? ` - ${l.work_types.name_bn}` : ""
            }`,
        লোক: l.headcount || "-",
        খোরাকি: l.khoraki_total || 0,
        মজুরি: l.wage_total || 0,
        মোট: (l.khoraki_total || 0) + (l.wage_total || 0),
    }));
    const laborSheet = XLSX.utils.json_to_sheet(laborData);
    XLSX.utils.book_append_sheet(wb, laborSheet, "শ্রমিক খরচ");

    // Materials sheet
    const materialsData = data.materials.map((m: any) => ({
        মালামাল: m.materials?.name_bn || m.custom_item_name,
        পরিমাণ: `${m.quantity} ${m.unit}`,
        দর: m.unit_rate,
        মোট: m.total_amount,
        সরবরাহকারী: m.supplier || "-",
    }));
    const materialsSheet = XLSX.utils.json_to_sheet(materialsData);
    XLSX.utils.book_append_sheet(wb, materialsSheet, "মালামাল ক্রয়");

    // Activities sheet
    const activitiesData = data.activities.map((a: any) => ({
        বিভাগ: a.expense_categories?.name_bn || "-",
        উপবিভাগ: a.expense_subcategories?.name_bn || "-",
        বিবরণ: a.description || "-",
        পরিমাণ: a.amount,
        বিক্রেতা: a.vendor || "-",
    }));
    const activitiesSheet = XLSX.utils.json_to_sheet(activitiesData);
    XLSX.utils.book_append_sheet(wb, activitiesSheet, "কাজের খরচ");

    // Advances sheet
    const advancesData = data.advances.map((a: any) => ({
        ব্যক্তি: a.users?.full_name || "-",
        পরিমাণ: a.amount,
        বিবরণ: a.description || "-",
    }));
    const advancesSheet = XLSX.utils.json_to_sheet(advancesData);
    XLSX.utils.book_append_sheet(wb, advancesSheet, "অগ্রিম প্রদান");

    // Generate filename
    const filename = `দৈনিক_হিসাব_${tender?.tender_code}_${date}.xlsx`;
    XLSX.writeFile(wb, filename);
}

// Export Labor Register to Excel
export function exportLaborReport(labor: any[], tender: any) {
    const data = labor.map((l) => ({
        তারিখ: formatDate(l.entry_date),
        ধরন: l.labor_type === "contract" ? "চুক্তি" : "দৈনিক",
        বিবরণ: `${l.crew_name || l.labor_name || "-"}${l.work_types ? ` - ${l.work_types.name_bn}` : ""
            }`,
        লোক: l.headcount || "-",
        খোরাকি: l.khoraki_total || 0,
        মজুরি: l.wage_total || 0,
        মোট: (l.khoraki_total || 0) + (l.wage_total || 0),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "শ্রমিক খতিয়ান");

    const filename = `শ্রমিক_খতিয়ান_${tender?.tender_code}.xlsx`;
    XLSX.writeFile(wb, filename);
}

// Export Materials Register to Excel
export function exportMaterialsReport(materials: any[], tender: any) {
    const data = materials.map((m) => ({
        তারিখ: formatDate(m.purchase_date),
        মালামাল: m.materials?.name_bn || m.custom_item_name,
        পরিমাণ: `${m.quantity} ${m.unit}`,
        দর: m.unit_rate,
        মোট: m.total_amount,
        সরবরাহকারী: m.supplier || "-",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "মালামাল খতিয়ান");

    const filename = `মালামাল_খতিয়ান_${tender?.tender_code}.xlsx`;
    XLSX.writeFile(wb, filename);
}

// Export Activities Register to Excel
export function exportActivitiesReport(activities: any[], tender: any) {
    const data = activities.map((a) => ({
        তারিখ: formatDate(a.expense_date),
        বিভাগ: a.expense_categories?.name_bn || "-",
        উপবিভাগ: a.expense_subcategories?.name_bn || "-",
        বিবরণ: a.description || "-",
        পরিমাণ: a.amount,
        বিক্রেতা: a.vendor || "-",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "কাজের খরচ খতিয়ান");

    const filename = `কাজের_খরচ_খতিয়ান_${tender?.tender_code}.xlsx`;
    XLSX.writeFile(wb, filename);
}

// Export Advances Register to Excel
export function exportAdvancesReport(balances: any[], tender: any) {
    const data = balances.map((bal) => ({
        ব্যক্তি: bal.person_name,
        ভূমিকা: bal.role,
        "মোট অগ্রিম": bal.total_advances,
        "মোট খরচ": bal.total_expenses,
        ব্যালেন্স: bal.balance,
        অবস্থা:
            bal.balance > 0 ? "বাকি" : bal.balance < 0 ? "পাওনা" : "সমান",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "অগ্রিম হিসাব");

    const filename = `অগ্রিম_হিসাব_${tender?.tender_code}.xlsx`;
    XLSX.writeFile(wb, filename);
}

// Export All Reports (Comprehensive)
export async function exportAllReports(tenderId: string, supabase: any) {
    const wb = XLSX.utils.book_new();

    // Get tender info
    const { data: tender } = await supabase
        .from("tenders")
        .select("*")
        .eq("id", tenderId)
        .single();

    // Labor data
    const { data: labor } = await supabase
        .from("labor_entries")
        .select("*, work_types(name_bn)")
        .eq("tender_id", tenderId)
        .order("entry_date", { ascending: false });

    const laborData = labor?.map((l: any) => ({
        তারিখ: formatDate(l.entry_date),
        ধরন: l.labor_type === "contract" ? "চুক্তি" : "দৈনিক",
        বিবরণ: `${l.crew_name || l.labor_name || "-"}${l.work_types ? ` - ${l.work_types.name_bn}` : ""
            }`,
        লোক: l.headcount || "-",
        খোরাকি: l.khoraki_total || 0,
        মজুরি: l.wage_total || 0,
        মোট: (l.khoraki_total || 0) + (l.wage_total || 0),
    }));
    const laborSheet = XLSX.utils.json_to_sheet(laborData || []);
    XLSX.utils.book_append_sheet(wb, laborSheet, "শ্রমিক খতিয়ান");

    // Materials data
    const { data: materials } = await supabase
        .from("material_purchases")
        .select("*, materials(name_bn)")
        .eq("tender_id", tenderId)
        .order("purchase_date", { ascending: false });

    const materialsData = materials?.map((m: any) => ({
        তারিখ: formatDate(m.purchase_date),
        মালামাল: m.materials?.name_bn || m.custom_item_name,
        পরিমাণ: `${m.quantity} ${m.unit}`,
        দর: m.unit_rate,
        মোট: m.total_amount,
        সরবরাহকারী: m.supplier || "-",
    }));
    const materialsSheet = XLSX.utils.json_to_sheet(materialsData || []);
    XLSX.utils.book_append_sheet(wb, materialsSheet, "মালামাল খতিয়ান");

    // Activities data
    const { data: activities } = await supabase
        .from("activity_expenses")
        .select("*, expense_categories(name_bn), expense_subcategories(name_bn)")
        .eq("tender_id", tenderId)
        .order("expense_date", { ascending: false });

    const activitiesData = activities?.map((a: any) => ({
        তারিখ: formatDate(a.expense_date),
        বিভাগ: a.expense_categories?.name_bn || "-",
        উপবিভাগ: a.expense_subcategories?.name_bn || "-",
        বিবরণ: a.description || "-",
        পরিমাণ: a.amount,
        বিক্রেতা: a.vendor || "-",
    }));
    const activitiesSheet = XLSX.utils.json_to_sheet(activitiesData || []);
    XLSX.utils.book_append_sheet(wb, activitiesSheet, "কাজের খরচ খতিয়ান");

    // Advances data
    const { data: balances } = await supabase.rpc("get_person_balances", {
        p_tender_id: tenderId,
    });

    const advancesData = balances?.map((bal: any) => ({
        ব্যক্তি: bal.person_name,
        ভূমিকা: bal.role,
        "মোট অগ্রিম": bal.total_advances,
        "মোট খরচ": bal.total_expenses,
        ব্যালেন্স: bal.balance,
        অবস্থা:
            bal.balance > 0 ? "বাকি" : bal.balance < 0 ? "পাওনা" : "সমান",
    }));
    const advancesSheet = XLSX.utils.json_to_sheet(advancesData || []);
    XLSX.utils.book_append_sheet(wb, advancesSheet, "অগ্রিম হিসাব");

    // Summary sheet
    const laborTotal =
        labor?.reduce(
            (sum: number, l: any) =>
                sum + Number(l.khoraki_total || 0) + Number(l.wage_total || 0),
            0
        ) || 0;
    const materialsTotal =
        materials?.reduce((sum: number, m: any) => sum + Number(m.total_amount || 0), 0) || 0;
    const activitiesTotal =
        activities?.reduce((sum: number, a: any) => sum + Number(a.amount || 0), 0) || 0;
    const advancesTotal =
        balances?.reduce((sum: number, a: any) => sum + Number(a.total_advances || 0), 0) || 0;

    const summaryData = [
        { বিবরণ: "শ্রমিক খরচ", "মোট টাকা": laborTotal },
        { বিবরণ: "মালামাল খরচ", "মোট টাকা": materialsTotal },
        { বিবরণ: "কাজের খরচ", "মোট টাকা": activitiesTotal },
        { বিবরণ: "অগ্রিম প্রদান", "মোট টাকা": advancesTotal },
        {
            বিবরণ: "সর্বমোট",
            "মোট টাকা": laborTotal + materialsTotal + activitiesTotal,
        },
    ];
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, "সারসংক্ষেপ");

    const filename = `সম্পূর্ণ_রিপোর্ট_${tender?.tender_code}_${new Date().toISOString().split("T")[0]
        }.xlsx`;
    XLSX.writeFile(wb, filename);
}
