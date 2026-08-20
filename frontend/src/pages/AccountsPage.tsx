import * as React from "react";
import { Pencil, Trash2 } from "lucide-react";
import {
  useAccounts,
  useCreateAccount,
  useDeleteAccount,
  useUpdateAccount,
  type AccountInput,
} from "@/features/accounts/api";
import { getErrorMessage, getFieldErrors } from "@/lib/api";
import { formatYen } from "@/lib/utils";
import type { Account, AccountType } from "@/types/api";
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

const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  cash: "現金",
  bank: "銀行",
  credit: "クレジット",
};

export default function AccountsPage() {
  const { data: accounts = [], isLoading } = useAccounts();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();

  const [editing, setEditing] = React.useState<Account | null>(null);
  const [isFormOpen, setFormOpen] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState<Account | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<AccountType>("cash");
  const [balance, setBalance] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  function openCreate() {
    setEditing(null);
    setName("");
    setType("cash");
    setBalance("");
    setFieldErrors({});
    setFormOpen(true);
  }

  function openEdit(account: Account) {
    setEditing(account);
    setName(account.name);
    setType(account.type);
    setBalance(String(Math.trunc(Number(account.balance))));
    setFieldErrors({});
    setFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    const input: AccountInput = { name, type, balance: Number(balance) };

    try {
      if (editing) {
        await updateAccount.mutateAsync({ id: editing.id, ...input });
      } else {
        await createAccount.mutateAsync(input);
      }
      setFormOpen(false);
    } catch (error) {
      setFieldErrors(getFieldErrors(error));
    }
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    setDeleteError(null);
    try {
      await deleteAccount.mutateAsync(pendingDelete.id);
      setPendingDelete(null);
    } catch (error) {
      setDeleteError(getErrorMessage(error, "削除できませんでした"));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink-900">口座管理</h1>
        <Button size="sm" onClick={openCreate}>
          口座を追加
        </Button>
      </div>

      <Card className="divide-y divide-ink-50">
        {isLoading && <p className="p-6 text-sm text-ink-400">読み込み中...</p>}
        {!isLoading && accounts.length === 0 && (
          <p className="p-6 text-sm text-ink-400">口座がまだ登録されていません</p>
        )}
        {accounts.map((account) => (
          <div key={account.id} className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="font-medium text-ink-900">{account.name}</p>
              <p className="text-sm text-ink-500">
                {ACCOUNT_TYPE_LABEL[account.type]} ・ {formatYen(Number(account.balance))}
              </p>
            </div>
            <div className="flex gap-1">
              <button
                aria-label="編集"
                className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                onClick={() => openEdit(account)}
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                aria-label="削除"
                className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                onClick={() => {
                  setDeleteError(null);
                  setPendingDelete(account);
                }}
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
            <DialogTitle>{editing ? "口座を編集" : "口座を追加"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="account-name">口座名</Label>
              <Input id="account-name" value={name} onChange={(e) => setName(e.target.value)} />
              {fieldErrors.name && <p className="text-sm text-ink-400">{fieldErrors.name}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>種別</Label>
              <Select value={type} onValueChange={(v) => setType(v as AccountType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">現金</SelectItem>
                  <SelectItem value="bank">銀行</SelectItem>
                  <SelectItem value="credit">クレジット</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="account-balance">初期残高</Label>
              <Input
                id="account-balance"
                type="number"
                inputMode="numeric"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
              />
              {fieldErrors.balance && <p className="text-sm text-ink-400">{fieldErrors.balance}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                キャンセル
              </Button>
              <Button type="submit" disabled={createAccount.isPending || updateAccount.isPending}>
                保存する
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>この口座を削除しますか？</DialogTitle>
            <DialogDescription>この操作は取り消せません。本当に削除しますか？</DialogDescription>
          </DialogHeader>
          {deleteError && <p className="text-sm text-caution-600">{deleteError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              キャンセル
            </Button>
            <Button onClick={handleConfirmDelete} disabled={deleteAccount.isPending}>
              削除する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
