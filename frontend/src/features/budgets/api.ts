import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Budget } from "@/types/api";

export function useBudgets(month?: string) {
  return useQuery({
    queryKey: ["budgets", month],
    queryFn: async () => (await api.get<Budget[]>("/api/budgets", { params: { month } })).data,
  });
}

export interface BudgetInput {
  category_id: number;
  amount: number;
  month: string;
}

export function useSaveBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: BudgetInput) => (await api.post<Budget>("/api/budgets", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["budgets"] }),
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/budgets/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["budgets"] }),
  });
}
