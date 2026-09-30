import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "@/features/auth/AuthContext";
import { api } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
  ensureCsrfCookie: vi.fn().mockResolvedValue(undefined),
  isApiError: (error: unknown) => Boolean((error as { isAxiosError?: boolean })?.isAxiosError),
}));

const userA = { id: 1, name: "Aさん", email: "a@example.com" };
const userB = { id: 2, name: "Bさん", email: "b@example.com" };
const unauthorized = { isAxiosError: true, response: { status: 401, data: {} } };

// 家計データのクエリキーはユーザーごとに分かれていないため、ここに前の人のデータが残ると問題になる
const USER_SCOPED_KEYS = [["transactions", {}], ["summary", "monthly", "2026-10"], ["piggy-bank", "this-week"]];

let currentUser: typeof userA | null;

function setup() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
  const hook = renderHook(() => useAuth(), { wrapper });
  return { queryClient, ...hook };
}

function seedDataOf(queryClient: QueryClient, owner: string) {
  for (const key of USER_SCOPED_KEYS) {
    queryClient.setQueryData(key, { owner });
  }
}

function cachedOwners(queryClient: QueryClient) {
  return USER_SCOPED_KEYS.map((key) => queryClient.getQueryData<{ owner: string }>(key)?.owner);
}

beforeEach(() => {
  vi.mocked(api.get).mockImplementation(async () => {
    if (currentUser === null) throw unauthorized;
    return { data: currentUser };
  });
  vi.mocked(api.post).mockImplementation(async (url: string, body?: unknown) => {
    if (url === "/api/logout") currentUser = null;
    if (url === "/api/login") currentUser = (body as { email: string }).email === userB.email ? userB : userA;
    return { data: null };
  });
});

describe("AuthProvider: 同じブラウザでのユーザー切り替え", () => {
  it("AさんがログアウトしてBさんがログインし直しても、Aさんの家計データのキャッシュを引き継がない", async () => {
    currentUser = userA;
    const { queryClient, result } = setup();
    await waitFor(() => expect(result.current.user?.id).toBe(userA.id));
    seedDataOf(queryClient, "A");

    await act(() => result.current.logout());
    await waitFor(() => expect(result.current.user).toBeNull());
    expect(cachedOwners(queryClient)).toEqual([undefined, undefined, undefined]);

    await act(() => result.current.login(userB.email, "password"));
    await waitFor(() => expect(result.current.user?.id).toBe(userB.id));
    expect(cachedOwners(queryClient)).toEqual([undefined, undefined, undefined]);
  });

  it("ログアウトを経ずにBさんとしてログインした場合も、Aさんのキャッシュを破棄する", async () => {
    currentUser = userA;
    const { queryClient, result } = setup();
    await waitFor(() => expect(result.current.user?.id).toBe(userA.id));
    seedDataOf(queryClient, "A");

    await act(() => result.current.login(userB.email, "password"));
    await waitFor(() => expect(result.current.user?.id).toBe(userB.id));
    expect(cachedOwners(queryClient)).toEqual([undefined, undefined, undefined]);
  });

  it("セッション切れなどでログイン中のユーザーが変わった場合も、前の人のキャッシュを破棄する", async () => {
    currentUser = userA;
    const { queryClient, result } = setup();
    await waitFor(() => expect(result.current.user?.id).toBe(userA.id));
    seedDataOf(queryClient, "A");

    // 別タブでBさんとしてログインし直した等で、サーバー側のセッションのユーザーが変わった状態
    currentUser = userB;
    await act(() => queryClient.invalidateQueries({ queryKey: ["auth", "user"] }));
    await waitFor(() => expect(result.current.user?.id).toBe(userB.id));
    expect(cachedOwners(queryClient)).toEqual([undefined, undefined, undefined]);
  });

  it("同じユーザーのままなら、家計データのキャッシュは残す", async () => {
    currentUser = userA;
    const { queryClient, result } = setup();
    await waitFor(() => expect(result.current.user?.id).toBe(userA.id));
    seedDataOf(queryClient, "A");

    await act(() => queryClient.invalidateQueries({ queryKey: ["auth", "user"] }));
    await waitFor(() => expect(result.current.user?.id).toBe(userA.id));
    expect(cachedOwners(queryClient)).toEqual(["A", "A", "A"]);
  });
});
