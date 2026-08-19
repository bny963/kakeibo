import * as React from "react";
import { useAccounts } from "@/features/accounts/api";
import { useCategories } from "@/features/categories/api";
import {
  useCreateTransaction,
  useUpdateTransaction,
  type TransactionInput,
} from "@/features/transactions/api";
import { getFieldErrors } from "@/lib/api";
import type { Transaction, TransactionType } from "@/types/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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

interface TransactionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 指定すると編集モードになる */
  transaction?: Transaction;
  /** 保存成功時に呼ばれる(ダッシュボードでの貯金箱通知などに利用) */
  onSaved?: (transaction: Transaction) => void;
}

const today = () => new Date().toISOString().slice(0, 10);

/**
 * 支出・収入の登録/編集モーダル（FN012-FN016）。
 * ダッシュボード（PG01）と取引一覧（PG02）の両方から呼び出す共通コンポーネント。
 */
export function TransactionFormDialog({
  open,
  onOpenChange,
  transaction,
  onSaved,
}: TransactionFormDialogProps) {
  const isEditing = !!transaction;
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();

  const [type, setType] = React.useState<TransactionType>("expense");
  const [accountId, setAccountId] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [date, setDate] = React.useState(today());
  const [note, setNote] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!open) return;

    setFieldErrors({});
    if (transaction) {
      setType(transaction.type);
      setAccountId(String(transaction.account_id));
      setCategoryId(String(transaction.category_id));
      setAmount(String(Math.trunc(Number(transaction.amount))));
      setDate(transaction.date);
      setNote(transaction.note ?? "");
    } else {
      setType("expense");
      setAccountId("");
      setCategoryId("");
      setAmount("");
      setDate(today());
      setNote("");
    }
  }, [open, transaction]);

  const categoriesForType = categories.filter((c) => c.type === type);
  const isPending = createTransaction.isPending || updateTransaction.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});

    const input: TransactionInput = {
      type,
      account_id: Number(accountId),
      category_id: Number(categoryId),
      amount: Number(amount),
      date,
      note: note || undefined,
    };

    try {
      const saved = isEditing
        ? await updateTransaction.mutateAsync({ id: transaction!.id, ...input })
        : await createTransaction.mutateAsync(input);

      onOpenChange(false);
      onSaved?.(saved);
    } catch (error) {
      setFieldErrors(getFieldErrors(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "取引を編集" : "支出・収入を登録"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label>種別</Label>
            <div className="flex gap-2">
              {(["expense", "income"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setType(t);
                    setCategoryId("");
                  }}
                  className={
                    "flex-1 rounded-lg border px-3 py-2 text-sm font-medium " +
                    (type === t
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-ink-200 bg-white text-ink-500")
                  }
                >
                  {t === "expense" ? "支出" : "収入"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tx-account">口座</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger id="tx-account">
                <SelectValue placeholder="口座を選択" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={String(account.id)}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.account_id && <p className="text-sm text-ink-400">{fieldErrors.account_id}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tx-category">カテゴリ</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="tx-category">
                <SelectValue placeholder="カテゴリを選択" />
              </SelectTrigger>
              <SelectContent>
                {categoriesForType.map((category) => (
                  <SelectItem key={category.id} value={String(category.id)}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.category_id && <p className="text-sm text-ink-400">{fieldErrors.category_id}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tx-amount">金額</Label>
            <Input
              id="tx-amount"
              type="number"
              inputMode="numeric"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {fieldErrors.amount && <p className="text-sm text-ink-400">{fieldErrors.amount}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tx-date">日付</Label>
            <Input id="tx-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            {fieldErrors.date && <p className="text-sm text-ink-400">{fieldErrors.date}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tx-note">メモ（任意）</Label>
            <Input id="tx-note" maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} />
            {fieldErrors.note && <p className="text-sm text-ink-400">{fieldErrors.note}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "保存中..." : "保存する"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
