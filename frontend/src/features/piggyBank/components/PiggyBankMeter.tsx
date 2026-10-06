import * as React from "react";
import { PiggyBank, Sparkles } from "lucide-react";
import { usePiggyBankSkinCatalog, useThisWeek } from "@/features/piggyBank/api";
import { PiggyBankCustomizeDialog } from "@/features/piggyBank/components/PiggyBankCustomizeDialog";
import { skinHeaderStyle } from "@/features/piggyBank/lib/skinPatterns";
import { FetchErrorNotice } from "@/components/FetchErrorNotice";
import { formatMonthLabel, formatYen } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PiggyBankMeterProps {
  onSetupPlan: () => void;
}

/**
 * 貯金箱UI（PG01 / FN031）。
 * 支出を引き算(マイナス)で見せず、使わなかった差額をプラスの報酬として可視化する。
 * メーターの塗りつぶし色は使用率に応じてgreen→amberに変わるが、赤字表現は一切使わない
 * （dataviz skillのMeter仕様: fillは同ランプの濃淡、状態色は配色ポリシーのgreen/gold/amberのみ）。
 *
 * カードのマスコット・装飾色・背景の柄はポイントで解禁した見た目（きせかえ）を反映するが、
 * これは完全にコスメティックな任意要素で、進捗バーの状態色（green/gold/amber）には一切影響しない。
 */
export function PiggyBankMeter({ onSetupPlan }: PiggyBankMeterProps) {
  const { data: week, isError, isFetching, refetch } = useThisWeek();
  const { data: skinCatalog } = usePiggyBankSkinCatalog();
  const [isCustomizeOpen, setCustomizeOpen] = React.useState(false);

  const equippedColor = skinCatalog?.skins.find(
    (skin) => skin.category === "color" && skin.equipped,
  )?.value ?? "#f472b6";
  const equippedPattern = skinCatalog?.skins.find(
    (skin) => skin.category === "pattern" && skin.equipped,
  )?.value ?? "none";
  const equippedCharacter = skinCatalog?.skins.find(
    (skin) => skin.category === "character" && skin.equipped,
  )?.value;

  const customizeDialog = (
    <PiggyBankCustomizeDialog open={isCustomizeOpen} onOpenChange={setCustomizeOpen} />
  );

  // 「取得中」と「取得失敗」を区別する。失敗時に「読み込み中」を出し続けると、利用者は待つしかなくなる。
  if (!week) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-ink-400">
          {isError ? (
            <FetchErrorNotice subject="今週の貯金箱" onRetry={() => refetch()} isRetrying={isFetching} />
          ) : (
            "今週の貯金箱を取得中..."
          )}
        </CardContent>
      </Card>
    );
  }

  const planMonthLabel = formatMonthLabel(week.plan_month);

  if (!week.has_plan) {
    return (
      <Card className="border-brand-200 bg-brand-50">
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          <PiggyBank className="h-10 w-10 text-brand-600" />
          {/* 強制改行をやめ、文節単位で折り返す（狭い画面で「と、」「ります。」だけが次の行に残らないように） */}
          <p className="max-w-sm text-sm text-ink-700 [text-wrap:pretty]">
            {planMonthLabel}の手取り・固定費・貯金目標を設定すると、1週間の利用可能額と貯金箱が使えるようになります。
          </p>
          <Button onClick={onSetupPlan}>{planMonthLabel}のプランを設定する</Button>
        </CardContent>
        {customizeDialog}
      </Card>
    );
  }

  const usageRate = week.weekly_allowance > 0
    ? Math.min(week.spent_amount / week.weekly_allowance, 1) * 100
    : 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader
        className="flex-row items-center justify-between gap-2 space-y-0"
        style={skinHeaderStyle(equippedPattern, equippedColor)}
      >
        <div className="flex items-center gap-2">
          {equippedCharacter ? (
            <span className="text-xl leading-none" aria-hidden="true">
              {equippedCharacter}
            </span>
          ) : (
            <PiggyBank className="h-5 w-5" style={{ color: equippedColor }} />
          )}
          <CardTitle>貯金箱</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          {skinCatalog && (
            <Badge variant="outline" className="hidden sm:inline-flex">
              {skinCatalog.points_balance.toLocaleString("ja-JP")}pt
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCustomizeOpen(true)}
            aria-label="貯金箱のきせかえ"
          >
            <Sparkles className="h-4 w-4" />
            きせかえ
          </Button>
        </div>
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

        <p className="mt-3 text-xs text-ink-400">
          貯金箱の金額は「今週の利用可能額 − 記録した支出」で、実際の預金額ではありません。記録していない支出は含まれないため、こまめに記録するほど正確になります。
        </p>

        {week.is_over_budget && (
          <p className="mt-4 rounded-lg bg-caution-50 px-4 py-3 text-sm text-caution-600">
            今週は少し使いすぎたかも。来週リセットしてまた頑張りましょう。
          </p>
        )}
      </CardContent>
      {customizeDialog}
    </Card>
  );
}
