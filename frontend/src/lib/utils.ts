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

/** YYYY-MM を「10月」のような表示用ラベルにする。 */
export function formatMonthLabel(month: string): string {
  return `${Number(month.slice(5, 7))}月`;
}

/**
 * 金額・日数などの整数入力欄の onChange 用。全角の数字・記号（０-９、．、－、，）を半角に揃えるだけで、
 * 文字は取り除かない。以前は数字以外を黙って取り除いていたため「1.5」が「15」、「-100」が「100」のように
 * 利用者の意図と異なる金額に変換されていた。許可しない入力の判定は送信時に parseIntegerInput で行う。
 */
export function normalizeIntegerInput(raw: string): string {
  return raw
    .replace(/[０-９．，]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[－−ー]/g, "-");
}

export type ParsedIntegerInput = { ok: true; value: number | null } | { ok: false; error: string };

/**
 * 整数入力欄の値を送信用の数値に変換する。空欄は value: null（必須チェックはAPI側に任せる）。
 * 前後の空白・桁区切りのカンマ・「円」「¥」表記は許容するが、小数・負数・その他の文字はエラーにする。
 * 何かを黙って取り除いて別の金額にすることはしない。
 */
export function parseIntegerInput(raw: string): ParsedIntegerInput {
  const trimmed = normalizeIntegerInput(raw).trim();
  if (trimmed === "") return { ok: true, value: null };

  const body = trimmed.replace(/^[¥￥]\s*/, "").replace(/\s*円$/, "");

  if (/^\d{1,3}(,\d{3})+$/.test(body) || /^\d+$/.test(body)) {
    const value = Number(body.replace(/,/g, ""));
    if (!Number.isSafeInteger(value)) return { ok: false, error: "数値が大きすぎます" };
    return { ok: true, value };
  }
  if (body.startsWith("-")) return { ok: false, error: "マイナスの値は入力できません" };
  if (/^[\d,]*\.\d*$/.test(body)) return { ok: false, error: "小数は入力できません。整数で入力してください" };
  return { ok: false, error: "半角または全角の数字で入力してください" };
}

/**
 * 複数の整数入力欄をまとめて parseIntegerInput し、送信用の値とフィールドごとのエラーに分ける。
 * 空欄は undefined のまま送る（0に丸めると「1円以上」等の的外れなエラーになるため、必須チェックはAPIに任せる）。
 */
export function parseIntegerFields<K extends string>(
  fields: Record<K, string>,
): { values: Record<K, number>; errors: Partial<Record<K, string>>; hasError: boolean } {
  const values = {} as Record<K, number>;
  const errors: Partial<Record<K, string>> = {};
  for (const key of Object.keys(fields) as K[]) {
    const parsed = parseIntegerInput(fields[key]);
    if (parsed.ok) {
      values[key] = (parsed.value ?? undefined) as unknown as number;
    } else {
      errors[key] = parsed.error;
    }
  }
  return { values, errors, hasError: Object.keys(errors).length > 0 };
}

/** 全角英数記号（Ａ-Ｚ、０-９、＠ 等）を半角に変換する。全角メールアドレスがそのまま送信される不具合対策。 */
export function normalizeFullWidthAscii(raw: string): string {
  return raw
    .replace(/[！-～]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/　/g, " ");
}
