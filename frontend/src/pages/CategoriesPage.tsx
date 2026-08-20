import * as React from "react";
import { Pencil, Trash2 } from "lucide-react";
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
  type CategoryInput,
} from "@/features/categories/api";
import { getErrorMessage, getFieldErrors } from "@/lib/api";
import type { Category, CategoryType } from "@/types/api";
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

const DEFAULT_COLOR = "#22a67e";

export default function CategoriesPage() {
  const { data: categories = [], isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [editing, setEditing] = React.useState<Category | null>(null);
  const [isFormOpen, setFormOpen] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState<Category | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<CategoryType>("expense");
  const [color, setColor] = React.useState(DEFAULT_COLOR);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  function openCreate() {
    setEditing(null);
    setName("");
    setType("expense");
    setColor(DEFAULT_COLOR);
    setFieldErrors({});
    setFormOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setName(category.name);
    setType(category.type);
    setColor(category.color ?? DEFAULT_COLOR);
    setFieldErrors({});
    setFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    const input: CategoryInput = { name, type, color };

    try {
      if (editing) {
        await updateCategory.mutateAsync({ id: editing.id, ...input });
      } else {
        await createCategory.mutateAsync(input);
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
      await deleteCategory.mutateAsync(pendingDelete.id);
      setPendingDelete(null);
    } catch (error) {
      // このカテゴリには取引が紐づいているため削除できません（エラーメッセージ設計 No.14）
      setDeleteError(getErrorMessage(error, "削除できませんでした"));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink-900">カテゴリ管理</h1>
        <Button size="sm" onClick={openCreate}>
          カテゴリを追加
        </Button>
      </div>

      <Card className="divide-y divide-ink-50">
        {isLoading && <p className="p-6 text-sm text-ink-400">読み込み中...</p>}
        {!isLoading && categories.length === 0 && (
          <p className="p-6 text-sm text-ink-400">カテゴリがまだ登録されていません</p>
        )}
        {categories.map((category) => (
          <div key={category.id} className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: category.color ?? DEFAULT_COLOR }}
              />
              <p className="font-medium text-ink-900">{category.name}</p>
              <Badge variant={category.type === "income" ? "success" : "outline"}>
                {category.type === "income" ? "収入" : "支出"}
              </Badge>
            </div>
            <div className="flex gap-1">
              <button
                aria-label="編集"
                className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                onClick={() => openEdit(category)}
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                aria-label="削除"
                className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                onClick={() => {
                  setDeleteError(null);
                  setPendingDelete(category);
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
            <DialogTitle>{editing ? "カテゴリを編集" : "カテゴリを追加"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="category-name">カテゴリ名</Label>
              <Input id="category-name" value={name} onChange={(e) => setName(e.target.value)} />
              {fieldErrors.name && <p className="text-sm text-ink-400">{fieldErrors.name}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>収支区分</Label>
              <Select value={type} onValueChange={(v) => setType(v as CategoryType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">支出</SelectItem>
                  <SelectItem value="income">収入</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="category-color">カラー</Label>
              <div className="flex items-center gap-2">
                <input
                  id="category-color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-ink-200"
                />
                <span className="text-sm text-ink-500">{color}</span>
              </div>
              {fieldErrors.color && <p className="text-sm text-ink-400">{fieldErrors.color}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                キャンセル
              </Button>
              <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending}>
                保存する
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>このカテゴリを削除しますか？</DialogTitle>
            <DialogDescription>この操作は取り消せません。本当に削除しますか？</DialogDescription>
          </DialogHeader>
          {deleteError && <p className="text-sm text-caution-600">{deleteError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              キャンセル
            </Button>
            <Button onClick={handleConfirmDelete} disabled={deleteCategory.isPending}>
              削除する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
