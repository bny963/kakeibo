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

/**
 * ローカルタイムゾーンでの今日の日付を YYYY-MM-DD で返す。
 * Date#toISOString はUTCに変換するため、JST 0:00〜8:59台に呼ぶと前日の日付を返してしまい、
 * 取引の日付初期値や「当月」判定がずれるバグの原因になる。必ずこちらを使う。
 */
export function todayLocalDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** ローカルタイムゾーンでの当月を YYYY-MM で返す（todayLocalDate 参照）。 */
export function currentLocalMonth(): string {
  return todayLocalDate().slice(0, 7);
}

/**
 * 金額・日数などの整数入力欄用。全角数字を半角に変換したうえで数字以外の文字を取り除く。
 * 小数点も取り除くため、四捨五入が黙って発生することもなくなる（金額は常に整数円で扱う）。
 */
export function normalizeIntegerInput(raw: string): string {
  const halfWidth = raw.replace(/[０-９]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xfee0));
  return halfWidth.replace(/[^0-9]/g, "");
}

/** 全角英数記号（Ａ-Ｚ、０-９、＠ 等）を半角に変換する。全角メールアドレスがそのまま送信される不具合対策。 */
export function normalizeFullWidthAscii(raw: string): string {
  return raw
    .replace(/[！-～]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/　/g, " ");
}
