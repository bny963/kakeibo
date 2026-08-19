import * as React from "react";
import { Download, Pencil, Trash2 } from "lucide-react";
import {
  exportTransactionsCsv,
  useDeleteTransaction,
  useTransactions,
  type TransactionFilters,
} from "@/features/transactions/api";
import { useCategories } from "@/features/categories/api";
import { TransactionFormDialog } from "@/features/transactions/components/TransactionFormDialog";
import type { Transaction } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatYen } from "@/lib/utils";

const ALL = "all";

export default function TransactionsPage() {
  const [filters, setFilters] = React.useState<TransactionFilters>({ page: 1 });
  const { data: categories = [] } = useCategories();
  const { data, isLoading } = useTransactions(filters);
  const deleteTransaction = useDeleteTransaction();

  const [editing, setEditing] = React.useState<Transaction | null>(null);
  const [isFormOpen, setFormOpen] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState<Transaction | null>(null);

  function updateFilter<K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    await deleteTransaction.mutateAsync(pendingDelete.id);
    setPendingDelete(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-ink-900">取引一覧</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportTransactionsCsv(filters)}
          >
            <Download className="h-4 w-4" />
            CSV出力
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            支出を登録
          </Button>
        </div>
      </div>

      {/* FN018: 日付範囲・カテゴリ・種別でのフィルター */}
      <Card className="p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="filter-from">開始日</Label>
            <Input
              id="filter-from"
              type="date"
              value={filters.from ?? ""}
              onChange={(e) => updateFilter("from", e.target.value || undefined)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="filter-to">終了日</Label>
            <Input
              id="filter-to"
              type="date"
              value={filters.to ?? ""}
              onChange={(e) => updateFilter("to", e.target.value || undefined)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>種別</Label>
            <Select
              value={filters.type ?? ALL}
              onValueChange={(v) => updateFilter("type", v === ALL ? undefined : (v as "income" | "expense"))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>すべて</SelectItem>
                <SelectItem value="expense">支出</SelectItem>
                <SelectItem value="income">収入</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>カテゴリ</Label>
            <Select
              value={filters.category_id ? String(filters.category_id) : ALL}
              onValueChange={(v) => updateFilter("category_id", v === ALL ? undefined : Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>すべて</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-ink-500">
              <th className="px-4 py-3 font-medium">日付</th>
              <th className="px-4 py-3 font-medium">カテゴリ</th>
              <th className="px-4 py-3 font-medium">口座</th>
              <th className="px-4 py-3 font-medium">メモ</th>
              <th className="px-4 py-3 text-right font-medium">金額</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-400">
                  読み込み中...
                </td>
              </tr>
            )}
            {!isLoading && data?.data.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-400">
                  取引がまだありません
                </td>
              </tr>
            )}
            {data?.data.map((transaction) => (
              <tr key={transaction.id} className="border-b border-ink-50 last:border-0">
                <td className="px-4 py-3 text-ink-700">{transaction.date}</td>
                <td className="px-4 py-3 text-ink-700">{transaction.category?.name}</td>
                <td className="px-4 py-3 text-ink-500">{transaction.account?.name}</td>
                <td className="px-4 py-3 text-ink-500">{transaction.note}</td>
                <td
                  className={
                    "px-4 py-3 text-right font-medium " +
                    (transaction.type === "income" ? "text-brand-600" : "text-ink-900")
                  }
                >
                  {transaction.type === "income" ? "+" : ""}
                  {formatYen(Number(transaction.amount))}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      aria-label="編集"
                      className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                      onClick={() => {
                        setEditing(transaction);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      aria-label="削除"
                      className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                      onClick={() => setPendingDelete(transaction)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {data && data.last_page > 1 && (
          <div className="flex items-center justify-between border-t border-ink-100 px-4 py-3 text-sm text-ink-500">
            <span>
              {data.total}件中 {(data.current_page - 1) * data.per_page + 1}〜
              {Math.min(data.current_page * data.per_page, data.total)}件
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={data.current_page <= 1}
                onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) - 1 }))}
              >
                前へ
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={data.current_page >= data.last_page}
                onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }))}
              >
                次へ
              </Button>
            </div>
          </div>
        )}
      </Card>

      <TransactionFormDialog
        open={isFormOpen}
        onOpenChange={setFormOpen}
        transaction={editing ?? undefined}
      />

      <Dialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>この取引を削除しますか？</DialogTitle>
            <DialogDescription>この操作は取り消せません。本当に削除しますか？</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              キャンセル
            </Button>
            <Button variant="default" onClick={handleConfirmDelete} disabled={deleteTransaction.isPending}>
              削除する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
