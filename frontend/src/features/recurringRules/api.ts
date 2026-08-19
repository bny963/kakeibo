import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { RecurringRule } from "@/types/api";

const KEY = ["recurring-rules"] as const;

export function useRecurringRules() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => (await api.get<RecurringRule[]>("/api/recurring-rules")).data,
  });
}

export interface RecurringRuleInput {
  category_id: number;
  name: string;
  amount: number;
  day_of_month: number;
}

export function useCreateRecurringRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: RecurringRuleInput) =>
      (await api.post<RecurringRule>("/api/recurring-rules", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateRecurringRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: RecurringRuleInput & { id: number }) =>
      (await api.put<RecurringRule>(`/api/recurring-rules/${id}`, input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteRecurringRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/recurring-rules/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
