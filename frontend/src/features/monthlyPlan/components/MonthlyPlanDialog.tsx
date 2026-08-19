import * as React from "react";
import { useMonthlyPlan, useSaveMonthlyPlan } from "@/features/monthlyPlan/api";
import { getFieldErrors } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MonthlyPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  month: string;
}

/**
 * 月次プラン（手取り・固定費・貯金目標）の設定モーダル。
 * 画面設計上の独立した画面IDは割り当てられていないため、ダッシュボード(PG01)から
 * 開く設定モーダルとして実装する（1週間の利用可能額の算出元、FN030 / テストケース一覧 No.10）。
 */
export function MonthlyPlanDialog({ open, onOpenChange, month }: MonthlyPlanDialogProps) {
  const { data: plan } = useMonthlyPlan(month);
  const saveMonthlyPlan = useSaveMonthlyPlan();

  const [income, setIncome] = React.useState("");
  const [fixedCosts, setFixedCosts] = React.useState("");
  const [savingsGoal, setSavingsGoal] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!open) return;
    setFieldErrors({});
    setIncome(plan ? String(Math.trunc(Number(plan.income))) : "");
    setFixedCosts(plan ? String(Math.trunc(Number(plan.fixed_costs))) : "");
    setSavingsGoal(plan ? String(Math.trunc(Number(plan.savings_goal))) : "");
  }, [open, plan]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});

    try {
      await saveMonthlyPlan.mutateAsync({
        month,
        income: Number(income),
        fixed_costs: Number(fixedCosts),
        savings_goal: Number(savingsGoal),
      });
      onOpenChange(false);
    } catch (error) {
      setFieldErrors(getFieldErrors(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>今月のプランを設定</DialogTitle>
          <DialogDescription>
            手取り − 固定費 − 貯金目標 を4.3週で割った金額が、1週間の利用可能額になります。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="plan-income">今月の手取り収入</Label>
            <Input
              id="plan-income"
              type="number"
              inputMode="numeric"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
            />
            {fieldErrors.income && <p className="text-sm text-ink-400">{fieldErrors.income}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="plan-fixed-costs">固定費の合計</Label>
            <Input
              id="plan-fixed-costs"
              type="number"
              inputMode="numeric"
              value={fixedCosts}
              onChange={(e) => setFixedCosts(e.target.value)}
            />
            {fieldErrors.fixed_costs && (
              <p className="text-sm text-ink-400">{fieldErrors.fixed_costs}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="plan-savings-goal">貯金目標額</Label>
            <Input
              id="plan-savings-goal"
              type="number"
              inputMode="numeric"
              value={savingsGoal}
              onChange={(e) => setSavingsGoal(e.target.value)}
            />
            {fieldErrors.savings_goal && (
              <p className="text-sm text-ink-400">{fieldErrors.savings_goal}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button type="submit" disabled={saveMonthlyPlan.isPending}>
              {saveMonthlyPlan.isPending ? "保存中..." : "保存する"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
