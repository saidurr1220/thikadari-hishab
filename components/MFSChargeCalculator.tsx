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
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-2">
      <div className="flex items-start gap-2">
        <svg
          className="w-5 h-5 text-yellow-600 mt-0.5"
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
          <p className="font-semibold text-yellow-900 text-sm mb-2">
            মোবাইল ব্যাংকিং চার্জ
          </p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-yellow-800">মূল টাকা:</span>
              <span className="font-medium text-yellow-900">
                ৳{baseAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-yellow-800">চার্জ (1.85%):</span>
              <span className="font-medium text-yellow-900">
                ৳{percentageCharge.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-yellow-800">ফি:</span>
              <span className="font-medium text-yellow-900">৳10.00</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-yellow-300">
              <span className="font-semibold text-yellow-900">মোট চার্জ:</span>
              <span className="font-bold text-yellow-900">
                ৳{totalCharge.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t-2 border-yellow-400">
              <span className="font-bold text-yellow-900">সর্বমোট:</span>
              <span className="font-bold text-yellow-900 text-lg">
                ৳{totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
