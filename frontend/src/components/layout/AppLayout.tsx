import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/AuthContext";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/dashboard", label: "ダッシュボード" },
  { to: "/transactions", label: "取引一覧" },
  { to: "/reports", label: "レポート" },
  { to: "/budgets", label: "予算設定" },
  { to: "/accounts", label: "口座管理" },
  { to: "/categories", label: "カテゴリ管理" },
  { to: "/recurring-rules", label: "固定費" },
];

/** ログイン必須画面共通のヘッダー付きレイアウト。画面遷移図のヘッダーメニューに対応。 */
export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="border-b border-ink-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <NavLink to="/dashboard" className="text-lg font-bold text-brand-700">
            Kakeibo
          </NavLink>
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "rounded-lg px-3 py-2 text-sm font-medium text-ink-500 hover:bg-ink-100 hover:text-ink-900",
                    isActive && "bg-brand-50 text-brand-700",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <NavLink
              to="/settings/profile"
              className="text-sm text-ink-500 hover:text-ink-900"
            >
              {user?.name ?? "プロフィール"}
            </NavLink>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              ログアウト
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
