import * as React from "react";
import { Pencil, Trash2 } from "lucide-react";
import {
  useCreateRecurringRule,
  useDeleteRecurringRule,
  useRecurringRules,
  useUpdateRecurringRule,
  type RecurringRuleInput,
} from "@/features/recurringRules/api";
import { useCategories } from "@/features/categories/api";
import { getFieldErrors } from "@/lib/api";
import { formatYen } from "@/lib/utils";
import type { RecurringRule } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function RecurringRulesPage() {
  const { data: rules = [], isLoading } = useRecurringRules();
  const { data: categories = [] } = useCategories();
  const expenseCategories = categories.filter((c) => c.type === "expense");

  const createRule = useCreateRecurringRule();
  const updateRule = useUpdateRecurringRule();
  const deleteRule = useDeleteRecurringRule();

  const [editing, setEditing] = React.useState<RecurringRule | null>(null);
  const [isFormOpen, setFormOpen] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState<RecurringRule | null>(null);

  const [name, setName] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [dayOfMonth, setDayOfMonth] = React.useState("1");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  function openCreate() {
    setEditing(null);
    setName("");
    setCategoryId("");
    setAmount("");
    setDayOfMonth("1");
    setFieldErrors({});
    setFormOpen(true);
  }

  function openEdit(rule: RecurringRule) {
    setEditing(rule);
    setName(rule.name);
    setCategoryId(String(rule.category_id));
    setAmount(String(Math.trunc(Number(rule.amount))));
    setDayOfMonth(String(rule.day_of_month));
    setFieldErrors({});
    setFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    const input: RecurringRuleInput = {
      name,
      category_id: Number(categoryId),
      amount: Number(amount),
      day_of_month: Number(dayOfMonth),
    };

    try {
      if (editing) {
        await updateRule.mutateAsync({ id: editing.id, ...input });
      } else {
        await createRule.mutateAsync(input);
      }
      setFormOpen(false);
    } catch (error) {
      setFieldErrors(getFieldErrors(error));
    }
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    await deleteRule.mutateAsync(pendingDelete.id);
    setPendingDelete(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink-900">固定費・サブスク管理</h1>
        <Button size="sm" onClick={openCreate}>
          固定費を追加
        </Button>
      </div>

      <Card className="divide-y divide-ink-50">
        {isLoading && <p className="p-6 text-sm text-ink-400">読み込み中...</p>}
        {!isLoading && rules.length === 0 && (
          <p className="p-6 text-sm text-ink-400">固定費・サブスクがまだ登録されていません</p>
        )}
        {rules.map((rule) => (
          <div key={rule.id} className="flex items-center justify-between px-5 py-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-ink-900">{rule.name}</p>
                {(rule.is_reminder_due || rule.is_overdue) && (
                  <Badge variant="notice">
                    {rule.is_overdue ? "支払い予定日を過ぎています" : "支払い予定日が近づいています"}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-ink-500">
                {rule.category?.name} ・ {formatYen(Number(rule.amount))} ・ 毎月{rule.day_of_month}日
                ・次回 {rule.next_date}
              </p>
            </div>
            <div className="flex gap-1">
              <button
                aria-label="編集"
                className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                onClick={() => openEdit(rule)}
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                aria-label="削除"
                className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                onClick={() => setPendingDelete(rule)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "固定費を編集" : "固定費を追加"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rule-name">名称（例：家賃、Netflix）</Label>
              <Input id="rule-name" value={name} onChange={(e) => setName(e.target.value)} />
              {fieldErrors.name && <p className="text-sm text-ink-400">{fieldErrors.name}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>カテゴリ</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="カテゴリを選択" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.category_id && (
                <p className="text-sm text-ink-400">{fieldErrors.category_id}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rule-amount">金額</Label>
              <Input
                id="rule-amount"
                type="number"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {fieldErrors.amount && <p className="text-sm text-ink-400">{fieldErrors.amount}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rule-day">毎月の発生日（1〜31）</Label>
              <Input
                id="rule-day"
                type="number"
                min={1}
                max={31}
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
              />
              {fieldErrors.day_of_month && (
                <p className="text-sm text-ink-400">{fieldErrors.day_of_month}</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                キャンセル
              </Button>
              <Button type="submit" disabled={createRule.isPending || updateRule.isPending}>
                保存する
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>この固定費を削除しますか？</DialogTitle>
            <DialogDescription>この操作は取り消せません。本当に削除しますか？</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              キャンセル
            </Button>
            <Button onClick={handleConfirmDelete} disabled={deleteRule.isPending}>
              削除する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
