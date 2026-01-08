"use client";

import { Printer, FileDown, Share2 } from "lucide-react";
import { useState } from "react";

export default function PrintButton() {
  const [showMenu, setShowMenu] = useState(false);

  const handlePrint = () => {
    window.print();
    setShowMenu(false);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'খাতা সারসংক্ষেপ',
          text: 'টেন্ডার হিসাব দেখুন',
          url: url,
        });
      } catch (err) {
        // Fallback to copy link
        copyLink(url);
      }
    } else {
      copyLink(url);
    }
    setShowMenu(false);
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('লিংক কপি হয়েছে!');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors print:hidden flex items-center gap-2 shadow-md"
        title="Print or Share"
      >
        <Printer className="w-4 h-4" />
        <span className="hidden sm:inline">প্রিন্ট/শেয়ার</span>
        <span className="sm:hidden">📄</span>
      </button>

      {showMenu && (
        <div className="absolute right-0 top-full mt-2 bg-white border rounded-lg shadow-xl z-50 min-w-[200px]">
          <button
            onClick={handlePrint}
            className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center gap-3 border-b"
          >
            <Printer className="w-4 h-4" />
            <span>প্রিন্ট/PDF সেভ</span>
          </button>
          <button
            onClick={handleShare}
            className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center gap-3"
          >
            <Share2 className="w-4 h-4" />
            <span>লিংক শেয়ার করুন</span>
          </button>
        </div>
      )}
    </div>
  );
}
