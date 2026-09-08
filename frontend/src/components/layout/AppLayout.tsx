import * as React from "react";
import { Menu, X } from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
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
  const location = useLocation();
  const [isMenuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

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
              className="hidden text-sm text-ink-500 hover:text-ink-900 md:block"
            >
              {user?.name ?? "プロフィール"}
            </NavLink>
            <Button variant="outline" size="sm" className="hidden md:inline-flex" onClick={handleLogout}>
              ログアウト
            </Button>
            <button
              type="button"
              aria-label={isMenuOpen ? "メニューを閉じる" : "メニューを開く"}
              aria-expanded={isMenuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-900 md:hidden"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <nav className="flex flex-col gap-1 border-t border-ink-100 px-4 py-3 md:hidden">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "rounded-lg px-3 py-2.5 text-sm font-medium text-ink-500 hover:bg-ink-100 hover:text-ink-900",
                    isActive && "bg-brand-50 text-brand-700",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            <NavLink
              to="/settings/profile"
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-500 hover:bg-ink-100 hover:text-ink-900"
            >
              {user?.name ?? "プロフィール"}
            </NavLink>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-ink-500 hover:bg-ink-100 hover:text-ink-900"
            >
              ログアウト
            </button>
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
