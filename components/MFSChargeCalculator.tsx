"use client";

import { useEffect } from "react";

interface MFSChargeCalculatorProps {
  amount: string;
  paymentMethod: string;
  onChargeCalculated: (charge: number, total: number) => void;
}

export default function MFSChargeCalculator({
  amount,
  paymentMethod,
  onChargeCalculated,
}: MFSChargeCalculatorProps) {
  useEffect(() => {
    if (paymentMethod === "mfs" && amount) {
      const baseAmount = parseFloat(amount);
      if (!isNaN(baseAmount) && baseAmount > 0) {
        // 1.85% charge + ৳10 fee
        const percentageCharge = baseAmount * 0.0185;
        const totalCharge = percentageCharge + 10;
        const totalAmount = baseAmount + totalCharge;

        onChargeCalculated(totalCharge, totalAmount);
      } else {
        onChargeCalculated(0, 0);
      }
    } else {
      onChargeCalculated(0, 0);
    }
  }, [amount, paymentMethod, onChargeCalculated]);

  if (paymentMethod !== "mfs" || !amount || parseFloat(amount) <= 0) {
    return null;
  }

  const baseAmount = parseFloat(amount);
  const percentageCharge = baseAmount * 0.0185;
  const totalCharge = percentageCharge + 10;
  const totalAmount = baseAmount + totalCharge;

  return (
    <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 space-y-3">
      <div className="flex items-start gap-2">
        <svg
          className="w-5 h-5 text-blue-600 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="flex-1">
          <p className="font-semibold text-blue-900 text-sm mb-3">
            💡 MFS চার্জ ব্রেকডাউন
          </p>
          <div className="space-y-2 text-sm">
            {/* Person will receive */}
            <div className="bg-green-100 border border-green-300 rounded p-2">
              <div className="flex justify-between items-center">
                <span className="text-green-800 font-medium">
                  ✓ ব্যক্তি পাবেন:
                </span>
                <span className="font-bold text-green-900 text-lg">
                  ৳{baseAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Your cost breakdown */}
            <div className="bg-orange-50 border border-orange-200 rounded p-2 space-y-1">
              <p className="text-orange-800 font-medium text-xs mb-1">
                আপনার খরচ:
              </p>
              <div className="flex justify-between text-xs">
                <span className="text-orange-700">• পাঠানো টাকা:</span>
                <span className="text-orange-900">
                  ৳{baseAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-orange-700">• MFS চার্জ (1.85%):</span>
                <span className="text-orange-900">
                  ৳{percentageCharge.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-orange-700">• সার্ভিস ফি:</span>
                <span className="text-orange-900">৳10.00</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-orange-300">
                <span className="font-semibold text-orange-900">
                  = আপনার মোট খরচ:
                </span>
                <span className="font-bold text-orange-900">
                  ৳{totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Important note */}
            <div className="bg-yellow-50 border border-yellow-300 rounded p-2 mt-2">
              <p className="text-xs text-yellow-800">
                <strong>নোট:</strong> MFS চার্জ (৳{totalCharge.toFixed(2)})
                আলাদা খরচ হিসেবে রেকর্ড হবে। ব্যক্তির ব্যালেন্স থেকে কাটা হবে
                না।
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
