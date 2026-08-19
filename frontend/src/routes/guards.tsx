import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";

/**
 * ログイン必須画面（PG01,PG02,PG03,PG04,PG05,PG06,PG11,PG12）用ガード。
 * 未認証状態でアクセスするとPG07（ログイン画面）へリダイレクトし、
 * ログイン成功後は元のURLへ遷移できるよう state に遷移元を保持する。
 */
export function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink-400">
        読み込み中...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

/**
 * 未認証専用画面（PG07,PG08,PG09,PG10）用ガード。
 * ログイン中の状態でアクセスするとPG01（ダッシュボード）へリダイレクトする（二重ログイン防止）。
 */
export function GuestRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink-400">
        読み込み中...
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
