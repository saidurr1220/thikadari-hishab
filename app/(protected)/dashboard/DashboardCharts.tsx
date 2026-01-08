"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { formatCurrency } from "@/lib/utils/format";

interface ExpenseData {
  name: string;
  value: number;
  color: string;
  [key: string]: any;
}

export default function DashboardCharts({
  expenseData,
}: {
  expenseData: ExpenseData[];
}) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-xl border-2 border-gray-200">
          <p className="font-bold text-gray-900 mb-1">{payload[0].name}</p>
          <p
            className="text-lg font-bold"
            style={{ color: payload[0].payload.color }}
          >
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    name,
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Only show label if percentage is greater than 5%
    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="#ffffff"
        textAnchor="middle"
        dominantBaseline="central"
        className="font-bold text-xs sm:text-sm drop-shadow-lg"
        style={{
          paintOrder: "stroke",
          stroke: "#000000",
          strokeWidth: "2px",
          strokeLinecap: "butt",
          strokeLinejoin: "miter",
        }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <>
      {/* Pie Chart */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <div className="w-2 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded"></div>
          খরচের বিভাজন
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={expenseData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={CustomLabel}
              outerRadius={90}
              innerRadius={40}
              fill="#8884d8"
              dataKey="value"
              paddingAngle={2}
            >
              {expenseData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mt-4">
          {expenseData.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              ></div>
              <span className="text-xs sm:text-sm text-gray-700 font-medium">
                {entry.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <div className="w-2 h-6 bg-gradient-to-b from-green-500 to-green-600 rounded"></div>
          খরচের তুলনা
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={expenseData}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              tick={{ fill: "#374151", fontSize: 13, fontWeight: 600 }}
              axisLine={{ stroke: "#9ca3af" }}
              tickLine={{ stroke: "#9ca3af" }}
            />
            <YAxis
              tick={{ fill: "#374151", fontSize: 12, fontWeight: 500 }}
              axisLine={{ stroke: "#9ca3af" }}
              tickLine={{ stroke: "#9ca3af" }}
              tickFormatter={(value) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                return value;
              }}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={80}>
              {expenseData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
