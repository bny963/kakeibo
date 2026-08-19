import { PiggyBank } from "lucide-react";
import { useThisWeek } from "@/features/piggyBank/api";
import { formatYen } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PiggyBankMeterProps {
  onSetupPlan: () => void;
}

/**
 * 貯金箱UI（PG01 / FN031）。
 * 支出を引き算(マイナス)で見せず、使わなかった差額をプラスの報酬として可視化する。
 * メーターの塗りつぶし色は使用率に応じてgreen→amberに変わるが、赤字表現は一切使わない
 * （dataviz skillのMeter仕様: fillは同ランプの濃淡、状態色は配色ポリシーのgreen/gold/amberのみ）。
 */
export function PiggyBankMeter({ onSetupPlan }: PiggyBankMeterProps) {
  const { data: week, isLoading } = useThisWeek();

  if (isLoading || !week) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-ink-400">読み込み中...</CardContent>
      </Card>
    );
  }

  if (!week.has_plan) {
    return (
      <Card className="border-brand-200 bg-brand-50">
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          <PiggyBank className="h-10 w-10 text-brand-600" />
          <p className="text-sm text-ink-700">
            今月の手取り・固定費・貯金目標を設定すると、
            <br />
            1週間の利用可能額と貯金箱が使えるようになります。
          </p>
          <Button onClick={onSetupPlan}>今月のプランを設定する</Button>
        </CardContent>
      </Card>
    );
  }

  const usageRate = week.weekly_allowance > 0
    ? Math.min(week.spent_amount / week.weekly_allowance, 1) * 100
    : 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <PiggyBank className="h-5 w-5 text-gold-600" />
        <CardTitle>貯金箱</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-ink-500">
          {week.is_over_budget ? "今週の貯金箱の様子" : "今週、貯金箱に貯まる予定"}
        </p>
        <p className="mt-1 text-4xl font-semibold text-gold-600">
          {formatYen(week.saved_amount)}
        </p>

        <div className="mt-4">
          <div
            className="h-3 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: week.is_over_budget ? "#feecc8" : "#d5f5e6" }}
            role="meter"
            aria-valuenow={Math.round(usageRate)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="今週の利用率"
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${usageRate}%`,
                backgroundColor: week.is_over_budget ? "#e08a1e" : "#22a67e",
              }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-ink-500">
            <span>使った金額 {formatYen(week.spent_amount)}</span>
            <span>今週の利用可能額 {formatYen(week.weekly_allowance)}</span>
          </div>
        </div>

        {week.is_over_budget && (
          <p className="mt-4 rounded-lg bg-caution-50 px-4 py-3 text-sm text-caution-600">
            今週は少し使いすぎたかも。来週リセットしてまた頑張りましょう。
          </p>
        )}
      </CardContent>
    </Card>
  );
}
