import type { PiggyBankWeekStatus } from "@/types/api";
import { formatYen } from "@/lib/utils";
import type { ToastVariant } from "@/hooks/use-toast";

export interface ExpenseResultMessage {
  title: string;
  description?: string;
  variant: ToastVariant;
}

/**
 * 支出登録後の結果メッセージを組み立てる。
 * 「-○○円」のような引き算の表現は使わず、貯金箱に貯まった金額をプラスの文脈で伝える
 * （FN032 / エラーメッセージ設計 No.9,10 / テストケース一覧 No.12）。
 */
export function buildExpenseResultMessage(status: PiggyBankWeekStatus): ExpenseResultMessage {
  if (status.is_over_budget) {
    return {
      title: "今週は少し使いすぎたかも",
      description: "来週リセットしてまた頑張りましょう。",
      variant: "caution",
    };
  }

  return {
    title: `今週はあと${formatYen(status.saved_amount)}貯金箱に貯まりました！`,
    variant: "success",
  };
}
