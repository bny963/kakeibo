import * as React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthContext";
import { getErrorMessage, getFieldErrors } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [bannerError, setBannerError] = React.useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => login(email, password),
    onSuccess: () => {
      const from = (location.state as { from?: Location })?.from;
      navigate(from?.pathname ?? "/dashboard", { replace: true });
    },
    onError: (error) => {
      const errors = getFieldErrors(error);
      setFieldErrors(errors);
      // ログイン失敗はメール/パスワードのどちらが誤りかを特定しないメッセージのみ表示する
      setBannerError(errors.email ?? getErrorMessage(error, "ログインできませんでした"));
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setBannerError(null);
    mutation.mutate();
  }

  return (
    <div>
      <h1 className="mb-6 text-center text-lg font-semibold text-ink-900">ログイン</h1>

      {bannerError && (
        <div className="mb-4 rounded-lg bg-caution-50 px-4 py-3 text-sm text-caution-600">
          {bannerError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">メールアドレス</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {fieldErrors.email && <p className="text-sm text-ink-400">{fieldErrors.email}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">パスワード</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {fieldErrors.password && <p className="text-sm text-ink-400">{fieldErrors.password}</p>}
        </div>

        <Button type="submit" disabled={mutation.isPending} className="mt-2">
          {mutation.isPending ? "ログイン中..." : "ログイン"}
        </Button>
      </form>

      <div className="mt-6 flex flex-col items-center gap-2 text-sm">
        <Link to="/forgot-password" className="text-ink-500 hover:text-ink-900">
          パスワードをお忘れですか
        </Link>
        <Link to="/register" className="text-brand-600 hover:underline">
          新規登録はこちら
        </Link>
      </div>
    </div>
  );
}
