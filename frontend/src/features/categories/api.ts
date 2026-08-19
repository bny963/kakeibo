import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Category, CategoryType } from "@/types/api";

const KEY = ["categories"] as const;

export function useCategories() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => (await api.get<Category[]>("/api/categories")).data,
  });
}

export interface CategoryInput {
  name: string;
  type: CategoryType;
  color?: string | null;
  icon?: string | null;
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CategoryInput) => (await api.post<Category>("/api/categories", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: CategoryInput & { id: number }) =>
      (await api.put<Category>(`/api/categories/${id}`, input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/categories/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
