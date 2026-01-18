"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Home,
  FileText,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Tender {
  id: string;
  tender_code: string;
  project_name: string;
  is_active: boolean;
}

interface SidebarProps {
  tenders: Tender[];
  userRole: string;
}

export default function Sidebar({ tenders, userRole }: SidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isTendersOpen, setIsTendersOpen] = useState(true);

  const activeTenders = tenders.filter((t) => t.is_active);

  const isActive = (path: string) => pathname === path;
  const isTenderActive = (tenderId: string) =>
    pathname.includes(`/tender/${tenderId}`);

  const SidebarContent = () => (
    <>
      {/* Company Info */}
      <div className="p-4 sm:p-6 border-b border-slate-200 bg-gradient-to-br from-blue-50 to-slate-50">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
            ঠি
          </div>
          <div className="flex-1">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
              ঠিকাদারি হিসাব
            </h2>
            <p className="text-xs text-gray-600">হিসাব ব্যবস্থাপনা</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-200">
          <div className="flex items-start gap-2 mb-2">
            <Building2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 leading-tight">
                মেসার্স সোনালী ট্রেডার্স
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed ml-6">
            ঠিকানাঃ ১৪৫, হোমনা সরকারি কলেজ রোড, হোমনা, কুমিল্লা।
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-1">
          {/* Dashboard */}
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
              isActive("/dashboard")
                ? "bg-blue-100 text-blue-700 font-semibold shadow-sm"
                : "text-gray-700 hover:bg-slate-100"
            }`}
          >
            <Home className="h-5 w-5" />
            <span>ড্যাশবোর্ড</span>
          </Link>

          {/* Tenders Section */}
          <div>
            <button
              onClick={() => setIsTendersOpen(!isTendersOpen)}
              className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-slate-100 transition-all"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5" />
                <span className="font-medium">টেন্ডার সমূহ</span>
              </div>
              {isTendersOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>

            {isTendersOpen && (
              <div className="ml-4 mt-1 space-y-1 border-l-2 border-slate-200 pl-4">
                {activeTenders.length === 0 ? (
                  <p className="text-xs text-gray-500 py-2">
                    কোনো সক্রিয় টেন্ডার নেই
                  </p>
                ) : (
                  activeTenders.map((tender) => (
                    <Link
                      key={tender.id}
                      href={`/tender/${tender.id}`}
                      className={`block px-3 py-2 rounded-lg text-sm transition-all ${
                        isTenderActive(tender.id)
                          ? "bg-blue-50 text-blue-700 font-semibold border-l-2 border-blue-600 -ml-[2px]"
                          : "text-gray-600 hover:bg-slate-50 hover:text-gray-900"
                      }`}
                    >
                      <div className="font-medium truncate">
                        {tender.project_name}
                      </div>
                      <div className="text-xs opacity-75 truncate">
                        {tender.tender_code}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Create Tender (Admin/Owner only) */}
          {(userRole === "admin" || userRole === "owner") && (
            <Link
              href="/admin/tenders/create"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-slate-100 transition-all"
            >
              <FileText className="h-5 w-5" />
              <span>নতুন টেন্ডার</span>
            </Link>
          )}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-slate-200 space-y-2 bg-slate-50">
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
            isActive("/settings")
              ? "bg-blue-100 text-blue-700 font-semibold"
              : "text-gray-700 hover:bg-slate-100"
          }`}
        >
          <Settings className="h-5 w-5" />
          <span>সেটিংস</span>
        </Link>

        <form action="/api/auth/signout" method="post">
          <Button
            type="submit"
            variant="outline"
            className="w-full justify-start gap-3 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
          >
            <LogOut className="h-5 w-5" />
            <span>লগ আউট</span>
          </Button>
        </form>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-30 p-2 rounded-lg bg-white shadow-lg border border-slate-200 hover:bg-slate-50 print:hidden"
      >
        {isMobileOpen ? (
          <X className="h-6 w-6 text-gray-700" />
        ) : (
          <Menu className="h-6 w-6 text-gray-700" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-72 lg:w-80
          bg-white border-r border-slate-200
          flex flex-col
          transition-transform duration-300 ease-in-out
          print:hidden
          ${
            isMobileOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
