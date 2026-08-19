import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthContext";
import { getErrorMessage, getFieldErrors } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [passwordConfirmation, setPasswordConfirmation] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [bannerError, setBannerError] = React.useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      register({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      }),
    // 会員登録後、自動ログイン状態でダッシュボードへ遷移する(FN005)
    onSuccess: () => navigate("/dashboard", { replace: true }),
    onError: (error) => {
      setFieldErrors(getFieldErrors(error));
      setBannerError(getErrorMessage(error, "登録に失敗しました"));
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
      <h1 className="mb-6 text-center text-lg font-semibold text-ink-900">ユーザー登録</h1>

      {bannerError && !Object.keys(fieldErrors).length && (
        <div className="mb-4 rounded-lg bg-caution-50 px-4 py-3 text-sm text-caution-600">
          {bannerError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">お名前</Label>
          <Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          {fieldErrors.name && <p className="text-sm text-ink-400">{fieldErrors.name}</p>}
        </div>

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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {fieldErrors.password && <p className="text-sm text-ink-400">{fieldErrors.password}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password_confirmation">確認用パスワード</Label>
          <Input
            id="password_confirmation"
            type="password"
            autoComplete="new-password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
          />
        </div>

        <Button type="submit" disabled={mutation.isPending} className="mt-2">
          {mutation.isPending ? "登録中..." : "登録する"}
        </Button>
      </form>

      <div className="mt-6 flex justify-center text-sm">
        <Link to="/login" className="text-brand-600 hover:underline">
          ログインはこちら
        </Link>
      </div>
    </div>
  );
}
