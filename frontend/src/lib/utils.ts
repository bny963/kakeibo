import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 円表示（例: 12345 -> "12,345円"）。マイナス表示は使わず、常に金額の絶対値をポジティブな文脈で扱う。 */
export function formatYen(amount: number): string {
  const rounded = Math.round(amount);
  return `${rounded.toLocaleString("ja-JP")}円`;
}
