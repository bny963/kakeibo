import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

const CURRENT_USER_QUERY_KEY = ["auth", "user"] as const;

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

  const login = React.useCallback(
    async (email: string, password: string) => {
      await ensureCsrfCookie();
      await api.post("/api/login", { email, password });
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
      await queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
    },
    [queryClient],
  );

  const logout = React.useCallback(async () => {
    await api.post("/api/logout");
    queryClient.setQueryData(CURRENT_USER_QUERY_KEY, null);
    await queryClient.invalidateQueries();
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

  const value = React.useMemo(
    () => ({ user, isLoading, login, register, logout, forgotPassword, resetPassword }),
    [user, isLoading, login, register, logout, forgotPassword, resetPassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
