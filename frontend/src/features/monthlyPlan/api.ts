import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, isApiError } from "@/lib/api";
import type { MonthlyPlan } from "@/types/api";

export function useMonthlyPlan(month: string) {
  return useQuery({
    queryKey: ["monthly-plan", month],
    queryFn: async () => {
      try {
        return (await api.get<MonthlyPlan>(`/api/monthly-plans/${month}`)).data;
      } catch (error) {
        // 未設定月は404になる。フロントでは「未設定」として扱う
        if (isApiError(error) && error.response.status === 404) return null;
        throw error;
      }
    },
  });
}

export interface MonthlyPlanInput {
  month: string;
  income: number;
  fixed_costs: number;
  savings_goal: number;
}

export function useSaveMonthlyPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: MonthlyPlanInput) =>
      (await api.post<MonthlyPlan>("/api/monthly-plans", input)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthly-plan"] });
      queryClient.invalidateQueries({ queryKey: ["piggy-bank"] });
    },
  });
}
