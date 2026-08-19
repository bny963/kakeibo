import { Outlet } from "react-router-dom";

/** 未認証画面（ログイン・登録・パスワードリセット）共通レイアウト。 */
export default function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4">
      <div className="w-full max-w-sm">
        <p className="mb-6 text-center text-2xl font-bold text-brand-700">Kakeibo</p>
        <div className="rounded-card border border-ink-100 bg-white p-6 shadow-sm">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
