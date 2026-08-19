import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { useRecurringRules } from "@/features/recurringRules/api";
import { formatYen } from "@/lib/utils";

/**
 * 次回発生日が3日以内、または支払い日を過ぎている固定費・サブスクをダッシュボードに
 * バナー表示する（FN036 / エラーメッセージ設計 No.16 / 状態遷移設計⑤）。
 * 警告色ではなく事前通知としての控えめなグレー系で表示する。
 */
export function RecurringReminderBanner() {
  const { data: rules = [] } = useRecurringRules();
  const dueRules = rules.filter((r) => r.is_reminder_due || r.is_overdue);

  if (dueRules.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-notice-200 bg-notice-50 p-4">
      {dueRules.map((rule) => (
        <div key={rule.id} className="flex items-center gap-2 text-sm text-notice-500">
          <Bell className="h-4 w-4 shrink-0" />
          <span>
            {rule.is_overdue
              ? `「${rule.name}」（${formatYen(Number(rule.amount))}）の支払い予定日を過ぎています`
              : `「${rule.name}」（${formatYen(Number(rule.amount))}）の支払い予定日が近づいています`}
          </span>
        </div>
      ))}
      <Link to="/recurring-rules" className="text-xs text-ink-500 underline">
        固定費・サブスク管理を開く
      </Link>
    </div>
  );
}
