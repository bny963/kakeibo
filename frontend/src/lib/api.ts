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

/** Laravelの {message, errors: {field: [msg, ...]}} 形式から、フィールドごとの先頭メッセージを取り出す。 */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (!isApiError(error) || !error.response.data.errors) return {};

  return Object.fromEntries(
    Object.entries(error.response.data.errors).map(([field, messages]) => [field, messages[0]]),
  );
}

/** フィールドに紐付かない一般的なエラーメッセージを取り出す(例: システムエラー、ネットワーク切断)。 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (isApiError(error) && error.response.data.message) {
    return error.response.data.message;
  }
  return fallback;
}
