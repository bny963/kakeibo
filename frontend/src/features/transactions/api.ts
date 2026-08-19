import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Paginated, Transaction, TransactionType } from "@/types/api";

export interface TransactionFilters {
  from?: string;
  to?: string;
  category_id?: number;
  type?: TransactionType;
  page?: number;
}

const listKey = (filters: TransactionFilters) => ["transactions", filters] as const;

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: listKey(filters),
    queryFn: async () =>
      (await api.get<Paginated<Transaction>>("/api/transactions", { params: filters })).data,
  });
}

export interface TransactionInput {
  type: TransactionType;
  account_id: number;
  category_id: number;
  amount: number;
  date: string;
  note?: string;
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: TransactionInput) =>
      (await api.post<Transaction>("/api/transactions", input)).data,
    onSuccess: () => invalidateTransactionRelatedQueries(queryClient),
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: TransactionInput & { id: number }) =>
      (await api.put<Transaction>(`/api/transactions/${id}`, input)).data,
    onSuccess: () => invalidateTransactionRelatedQueries(queryClient),
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/transactions/${id}`);
    },
    onSuccess: () => invalidateTransactionRelatedQueries(queryClient),
  });
}

/** 取引の作成・更新・削除は集計系・貯金箱系の表示にも影響するため、まとめて再取得する。 */
function invalidateTransactionRelatedQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["transactions"] });
  queryClient.invalidateQueries({ queryKey: ["summary"] });
  queryClient.invalidateQueries({ queryKey: ["piggy-bank"] });
  queryClient.invalidateQueries({ queryKey: ["budgets"] });
}

/** FN029: 期間・カテゴリを指定してCSVファイルをダウンロードする。 */
export async function exportTransactionsCsv(filters: Omit<TransactionFilters, "page">) {
  const response = await api.get("/api/transactions/export", {
    params: filters,
    responseType: "blob",
  });

  const disposition = response.headers["content-disposition"] as string | undefined;
  const filenameMatch = disposition?.match(/filename="?([^"]+)"?/);
  const filename = filenameMatch?.[1] ?? "transactions.csv";

  const url = URL.createObjectURL(response.data as Blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
