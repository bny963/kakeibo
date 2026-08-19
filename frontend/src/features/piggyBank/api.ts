import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PiggyBankHistory, PiggyBankWeekStatus } from "@/types/api";

export function useThisWeek() {
  return useQuery({
    queryKey: ["piggy-bank", "this-week"],
    queryFn: async () => (await api.get<PiggyBankWeekStatus>("/api/piggy-bank/this-week")).data,
  });
}

export function usePiggyBankHistory() {
  return useQuery({
    queryKey: ["piggy-bank", "history"],
    queryFn: async () => (await api.get<PiggyBankHistory>("/api/piggy-bank")).data,
  });
}
