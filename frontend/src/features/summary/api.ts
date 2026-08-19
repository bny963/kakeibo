import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CategorySummary, CategoryType, MonthlySummary } from "@/types/api";

export function useMonthlySummary(month?: string) {
  return useQuery({
    queryKey: ["summary", "monthly", month],
    queryFn: async () =>
      (await api.get<MonthlySummary>("/api/summary/monthly", { params: { month } })).data,
  });
}

export function useCategorySummary(month?: string, type: CategoryType = "expense") {
  return useQuery({
    queryKey: ["summary", "category", month, type],
    queryFn: async () =>
      (await api.get<CategorySummary>("/api/summary/category", { params: { month, type } })).data,
  });
}
