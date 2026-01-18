export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 2,
  })
    .format(amount)
    .replace(/\u00A0/g, " ");
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB");
}

export function formatDateBangla(date: Date | string): string {
  return formatDate(date);
}

export function toBanglaNumber(num: number | string): string {
  return num.toString();
}

export function toEnglishNumber(banglaNum: string): string {
  return banglaNum;
}

export function formatPercentage(value: number, total: number): string {
  if (total === 0) return "0%";
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(1)}%`;
}
