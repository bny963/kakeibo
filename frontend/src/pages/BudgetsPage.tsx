import * as React from "react";
import { useBudgets, useSaveBudget } from "@/features/budgets/api";
import { useCategories } from "@/features/categories/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { formatYen } from "@/lib/utils";
import type { Budget } from "@/types/api";

const currentMonth = () => new Date().toISOString().slice(0, 7);

// 状態遷移設計③: 順調(green) / まもなく到達・超過(amber)。赤字は使用しない。
const STATUS_BADGE: Record<Budget["status"], { label: string; variant: "success" | "caution" }> = {
  ok: { label: "順調", variant: "success" },
  near: { label: "予算まもなく到達", variant: "caution" },
  over: { label: "予算を超えています", variant: "caution" },
};

export default function BudgetsPage() {
  const month = currentMonth();
  const { data: categories = [] } = useCategories();
  const { data: budgets = [], isLoading } = useBudgets(month);
  const saveBudget = useSaveBudget();

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const budgetByCategory = new Map(budgets.map((b) => [b.category_id, b]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">予算設定</h1>
        <p className="mt-1 text-sm text-ink-500">{month} のカテゴリ別月予算</p>
      </div>

      {isLoading && <p className="text-sm text-ink-400">読み込み中...</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        {expenseCategories.map((category) => {
          const budget = budgetByCategory.get(category.id);
          return (
            <BudgetRow
              key={category.id}
              categoryId={category.id}
              categoryName={category.name}
              month={month}
              budget={budget}
              onSave={(amount) =>
                saveBudget.mutateAsync({ category_id: category.id, amount, month })
              }
            />
          );
        })}
        {!isLoading && expenseCategories.length === 0 && (
          <p className="text-sm text-ink-400">
            先に「カテゴリ管理」で支出カテゴリを登録してください。
          </p>
        )}
      </div>
    </div>
  );
}

function BudgetRow({
  categoryName,
  budget,
  onSave,
}: {
  categoryId: number;
  categoryName: string;
  month: string;
  budget?: Budget;
  onSave: (amount: number) => Promise<unknown>;
}) {
  const [amount, setAmount] = React.useState(
    budget ? String(Math.trunc(Number(budget.amount))) : "",
  );
  const [isSaving, setSaving] = React.useState(false);

  async function handleSave() {
    if (!amount) return;
    setSaving(true);
    try {
      await onSave(Number(amount));
    } finally {
      setSaving(false);
    }
  }

  const status = budget ? STATUS_BADGE[budget.status] : null;

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="font-medium text-ink-900">{categoryName}</p>
          {status && <Badge variant={status.variant}>{status.label}</Badge>}
        </div>

        {budget && (
          <div className="mt-3">
            <Progress
              value={budget.usage_rate}
              indicatorClassName={budget.status === "ok" ? "bg-brand-500" : "bg-caution-400"}
            />
            <p className="mt-1 text-xs text-ink-500">
              {formatYen(budget.spent)} / {formatYen(Number(budget.amount))}（使用率
              {budget.usage_rate}%）
            </p>
          </div>
        )}

        <div className="mt-3 flex gap-2">
          <Input
            type="number"
            inputMode="numeric"
            placeholder="予算額を入力"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Button size="sm" onClick={handleSave} disabled={isSaving || !amount}>
            保存
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
