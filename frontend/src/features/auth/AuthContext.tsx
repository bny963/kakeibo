import * as React from "react";
import { type QueryClient, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ensureCsrfCookie, isApiError } from "@/lib/api";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null | undefined;
  /** 初回のユーザー情報取得中（trueの間はガードによるリダイレクトを保留する） */
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (input: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) => Promise<void>;
  updateProfile: (input: {
    name: string;
    current_password?: string;
    password?: string;
    password_confirmation?: string;
  }) => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

const CURRENT_USER_QUERY_KEY = ["auth", "user"] as const;

/**
 * ログイン中ユーザー以外の、家計データのキャッシュをすべて破棄する。
 * 家計データのクエリキー（["transactions"], ["summary", ...] 等）はユーザーごとに分かれていないため、
 * 無効化（古い状態として扱う）だけでは、同じブラウザで別の人がログインし直した際に前の人のデータが
 * 再取得完了までそのまま表示されてしまう。ユーザーが切り替わる時点でキャッシュ自体を削除する。
 */
function clearUserScopedQueries(queryClient: QueryClient) {
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== CURRENT_USER_QUERY_KEY[0] });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: async () => {
      try {
        const { data } = await api.get<AuthUser>("/api/user");
        return data;
      } catch (error) {
        if (isApiError(error) && error.response.status === 401) {
          return null;
        }
        throw error;
      }
    },
    retry: false,
    staleTime: 60_000,
  });

  // セッション切れ（401）など、login/logout を経由せずにユーザーが変わった場合にも前の人のデータを残さない
  const previousUserId = React.useRef<number | null | undefined>(undefined);
  React.useEffect(() => {
    if (isLoading) return;
    const currentUserId = user?.id ?? null;
    if (previousUserId.current !== undefined && previousUserId.current !== currentUserId) {
      clearUserScopedQueries(queryClient);
    }
    previousUserId.current = currentUserId;
  }, [user?.id, isLoading, queryClient]);

  const login = React.useCallback(
    async (email: string, password: string) => {
      await ensureCsrfCookie();
      await api.post("/api/login", { email, password });
      clearUserScopedQueries(queryClient);
      await queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
    },
    [queryClient],
  );

  const register = React.useCallback(
    async (input: {
      name: string;
      email: string;
      password: string;
      password_confirmation: string;
    }) => {
      await ensureCsrfCookie();
      await api.post("/api/register", input);
      clearUserScopedQueries(queryClient);
      await queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
    },
    [queryClient],
  );

  const logout = React.useCallback(async () => {
    await api.post("/api/logout");
    queryClient.setQueryData(CURRENT_USER_QUERY_KEY, null);
    // 以前は invalidateQueries（古い状態として扱うだけ）だったため、キャッシュ自体は残っていた。
    // 再取得はせずキャッシュを削除する（再取得すると失効済みセッションへの401が出るため）。
    clearUserScopedQueries(queryClient);
  }, [queryClient]);

  const forgotPassword = React.useCallback(async (email: string) => {
    await ensureCsrfCookie();
    await api.post("/api/forgot-password", { email });
  }, []);

  const resetPassword = React.useCallback(
    async (input: {
      token: string;
      email: string;
      password: string;
      password_confirmation: string;
    }) => {
      await ensureCsrfCookie();
      await api.post("/api/reset-password", input);
    },
    [],
  );

  const updateProfile = React.useCallback(
    async (input: {
      name: string;
      current_password?: string;
      password?: string;
      password_confirmation?: string;
    }) => {
      const { data } = await api.put<AuthUser>("/api/user", input);
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, data);
    },
    [queryClient],
  );

  const value = React.useMemo(
    () => ({
      user,
      isLoading,
      login,
      register,
      logout,
      forgotPassword,
      resetPassword,
      updateProfile,
    }),
    [user, isLoading, login, register, logout, forgotPassword, resetPassword, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
