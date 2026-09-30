import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Settings2 } from "lucide-react";
import { useMonthlySummary } from "@/features/summary/api";
import { useThisWeek } from "@/features/piggyBank/api";
import { PiggyBankMeter } from "@/features/piggyBank/components/PiggyBankMeter";
import { MonthlyPlanDialog } from "@/features/monthlyPlan/components/MonthlyPlanDialog";
import { RecurringReminderBanner } from "@/features/recurringRules/components/RecurringReminderBanner";
import { TransactionFormDialog } from "@/features/transactions/components/TransactionFormDialog";
import type { PiggyBankWeekStatus, Transaction } from "@/types/api";
import { FetchErrorNotice } from "@/components/FetchErrorNotice";
import { StatTile } from "@/components/StatTile";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { buildExpenseResultMessage } from "@/lib/piggyBankMessages";
import { currentLocalMonth as currentMonth, formatMonthLabel } from "@/lib/utils";

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const month = currentMonth();

  const { data: summary, isError: isSummaryError, isFetching: isSummaryFetching, refetch: refetchSummary } =
    useMonthlySummary(month);
  // 週の利用可能額は「週の木曜日が属する月」のプランで計算されるため、プラン設定もその月を開く
  // （例: 10/1(木)の週は9/28開始でも10月のプランを使う）。取得前は当月を仮に使う。
  const { data: week } = useThisWeek();
  const planMonth = week?.plan_month ?? month;
  const [isAddOpen, setAddOpen] = React.useState(false);
  const [isPlanOpen, setPlanOpen] = React.useState(false);

  async function handleTransactionSaved(transaction: Transaction) {
    if (transaction.type !== "expense") return;

    // 支出登録後の結果表示は「-○○円」ではなく「今週はあと○○円貯金箱に貯まりました」という
    // 前向きな文脈で表示する（FN032 / テストケース一覧 No.12）
    const fresh = await queryClient.fetchQuery<PiggyBankWeekStatus>({
      queryKey: ["piggy-bank", "this-week"],
      queryFn: async () => (await api.get<PiggyBankWeekStatus>("/api/piggy-bank/this-week")).data,
    });

    toast(buildExpenseResultMessage(fresh));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-ink-900">ダッシュボード</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPlanOpen(true)}>
            <Settings2 className="h-4 w-4" />
            {formatMonthLabel(planMonth)}のプラン
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            支出を登録
          </Button>
        </div>
      </div>

      <RecurringReminderBanner />

      <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
        <PiggyBankMeter onSetupPlan={() => setPlanOpen(true)} />

        {/* 取得中・取得失敗は0円と区別して表示する（取得できた結果が0円の場合のみ0円と表示） */}
        {isSummaryError && !summary ? (
          <FetchErrorNotice subject="今月の集計" onRetry={() => refetchSummary()} isRetrying={isSummaryFetching} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-1">
            <StatTile label="今月の収入" value={summary?.income} delta={summary ? summary.income - summary.prev_income : undefined} upGood />
            <StatTile label="今月の支出" value={summary?.expense} delta={summary ? summary.expense - summary.prev_expense : undefined} upGood={false} />
            <StatTile label="今月の残高" value={summary?.balance} />
          </div>
        )}
      </div>

      <TransactionFormDialog open={isAddOpen} onOpenChange={setAddOpen} onSaved={handleTransactionSaved} />
      <MonthlyPlanDialog open={isPlanOpen} onOpenChange={setPlanOpen} month={planMonth} />
    </div>
  );
}
