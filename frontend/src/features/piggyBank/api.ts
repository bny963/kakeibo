import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PiggyBankHistory, PiggyBankSkinCatalog, PiggyBankWeekStatus } from "@/types/api";

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

/**
 * 貯金箱のビジュアル（色・柄・キャラクター）カタログ・ポイント残高・装着状態を取得する。
 * コスメティック要素のみを扱う任意機能で、無視してもダッシュボード等の本来機能には影響しない。
 */
export function usePiggyBankSkinCatalog() {
  return useQuery({
    queryKey: ["piggy-bank", "skins"],
    queryFn: async () => (await api.get<PiggyBankSkinCatalog>("/api/piggy-bank/skins")).data,
  });
}

export function useUnlockPiggyBankSkin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (skinKey: string) =>
      (await api.post<PiggyBankSkinCatalog>(`/api/piggy-bank/skins/${skinKey}/unlock`)).data,
    onSuccess: (data) => {
      queryClient.setQueryData(["piggy-bank", "skins"], data);
    },
  });
}

export function useEquipPiggyBankSkin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (skinKey: string) =>
      (await api.post<PiggyBankSkinCatalog>(`/api/piggy-bank/skins/${skinKey}/equip`)).data,
    onSuccess: (data) => {
      queryClient.setQueryData(["piggy-bank", "skins"], data);
    },
  });
}
