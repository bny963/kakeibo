import axios from "axios";

/**
 * Laravel Sanctum SPA (Cookie) 認証用のAPIクライアント。
 * withCredentials: セッションCookieを送受信する
 * withXSRFToken: XSRF-TOKENクッキーを読み取り X-XSRF-TOKEN ヘッダーへ自動付与する（CSRF対策、基本設計書参照）
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000",
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    Accept: "application/json",
  },
});

/** Sanctum SPA認証では、状態変更系リクエストの前にCSRF Cookieを取得しておく必要がある。 */
export async function ensureCsrfCookie(): Promise<void> {
  await api.get("/sanctum/csrf-cookie");
}

export interface ApiErrorPayload {
  message: string;
  errors?: Record<string, string[]>;
}

export function isApiError(error: unknown): error is { response: { status: number; data: ApiErrorPayload } } {
  return axios.isAxiosError(error) && error.response !== undefined;
}
