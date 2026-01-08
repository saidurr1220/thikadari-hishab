"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { labels } from "@/lib/utils/bangla";
import { createClient } from "@/lib/supabase/client";
import { exportAllReports } from "@/lib/utils/excel";
import { 
  FileSpreadsheet, 
  Download, 
  Calendar, 
  HardHat, 
  Package, 
  ClipboardList, 
  Users, 
  FileText,
  ArrowLeft,
  TrendingUp,
  BarChart3
} from "lucide-react";

export default function ReportsMenuPage({
  params,
}: {
  params: { tenderId: string };
}) {
  const [exporting, setExporting] = useState(false);

  const handleExportAll = async () => {
    setExporting(true);
    try {
      const supabase = createClient();
      await exportAllReports(params.tenderId, supabase);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setExporting(false);
    }
  };

  const reports = [
    {
      id: "daily",
      title: labels.dailySheet,
      description: "একদিনের সব খরচ দেখুন",
      icon: Calendar,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      href: `/tender/${params.tenderId}/reports/daily`,
    },
    {
      id: "labor",
      title: labels.laborRegister,
      description: "শ্রমিক খতিয়ান এবং মজুরি",
      icon: HardHat,
      color: "from-amber-500 to-orange-600",
      bgColor: "bg-amber-50",
      iconColor: "text-amber-600",
      href: `/tender/${params.tenderId}/reports/labor`,
    },
    {
      id: "materials",
      title: labels.materialsRegister,
      description: "মালামাল ক্রয় এবং স্টক",
      icon: Package,
      color: "from-sky-500 to-cyan-600",
      bgColor: "bg-sky-50",
      iconColor: "text-sky-600",
      href: `/tender/${params.tenderId}/reports/materials`,
    },
    {
      id: "activities",
      title: labels.activityRegister,
      description: "সাইট খরচ ও দৈনিক খরচ খতিয়ান",
      icon: ClipboardList,
      color: "from-emerald-500 to-green-600",
      bgColor: "bg-emerald-50",
      iconColor: "text-emerald-600",
      href: `/tender/${params.tenderId}/reports/activities`,
    },
    {
      id: "advances",
      title: labels.advanceLedger,
      description: "অগ্রিম ও খরচের হিসাব",
      icon: Users,
      color: "from-violet-500 to-purple-600",
      bgColor: "bg-violet-50",
      iconColor: "text-violet-600",
      href: `/tender/${params.tenderId}/reports/advances`,
    },
    {
      id: "summary",
      title: labels.tenderSummary,
      description: "সম্পূর্ণ প্রকল্পের সারসংক্ষেপ",
      icon: BarChart3,
      color: "from-rose-500 to-pink-600",
      bgColor: "bg-rose-50",
      iconColor: "text-rose-600",
      href: `/tender/${params.tenderId}/reports/summary`,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex-1 w-full sm:w-auto">
              <Link
                href={`/tender/${params.tenderId}`}
                className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors mb-1.5 sm:mb-2"
              >
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                টেন্ডার ড্যাশবোর্ড
              </Link>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <FileText className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 truncate">
                    {labels.reports}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600">সব রিপোর্ট এক জায়গায়</p>
                </div>
              </div>
            </div>
            
            <Button
              onClick={handleExportAll}
              disabled={exporting}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg gap-1.5 sm:gap-2 w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9 md:h-10 px-3 sm:px-4"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4" />
              {exporting ? "Export হচ্ছে..." : "সম্পূর্ণ Export"}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Info Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 mb-8 text-white shadow-xl">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">রিপোর্ট সিস্টেম</h2>
              <p className="text-blue-100 text-sm leading-relaxed">
                আপনার প্রকল্পের সব তথ্য সুন্দর এবং সহজবোধ্য রিপোর্টে দেখুন। 
                প্রতিটি রিপোর্ট Excel এ export করা যাবে।
              </p>
            </div>
          </div>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => {
            const IconComponent = report.icon;
            return (
              <Link key={report.id} href={report.href}>
                <Card className="group relative overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0 bg-white/80 backdrop-blur-sm h-full">
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${report.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                  
                  <CardHeader className="pb-4">
                    <div className={`inline-flex h-14 w-14 rounded-2xl ${report.bgColor} items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                      <IconComponent className={`h-7 w-7 ${report.iconColor}`} />
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-indigo-600 transition-all">
                      {report.title}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-slate-600 mb-4 text-sm leading-relaxed">
                      {report.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-600 group-hover:text-indigo-600 transition-colors">
                      <span>রিপোর্ট দেখুন</span>
                      <ArrowLeft className="h-4 w-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600 uppercase tracking-wider mb-1">
                    Available Reports
                  </p>
                  <p className="text-2xl font-bold text-slate-900">{reports.length}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600 uppercase tracking-wider mb-1">
                    Export Format
                  </p>
                  <p className="text-2xl font-bold text-slate-900">Excel</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center">
                  <FileSpreadsheet className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600 uppercase tracking-wider mb-1">
                    Real-time Data
                  </p>
                  <p className="text-2xl font-bold text-slate-900">Live</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600 uppercase tracking-wider mb-1">
                    Print Ready
                  </p>
                  <p className="text-2xl font-bold text-slate-900">Yes</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
