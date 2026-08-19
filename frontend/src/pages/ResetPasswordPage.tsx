import * as React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthContext";
import { getErrorMessage, getFieldErrors } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [password, setPassword] = React.useState("");
  const [passwordConfirmation, setPasswordConfirmation] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [bannerError, setBannerError] = React.useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      resetPassword({
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      }),
    onSuccess: () => {
      toast({
        title: "パスワードを再設定しました",
        description: "新しいパスワードでログインしてください",
        variant: "success",
      });
      navigate("/login", { replace: true });
    },
    onError: (error) => {
      setFieldErrors(getFieldErrors(error));
      setBannerError(getErrorMessage(error, "パスワードを再設定できませんでした"));
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
      <h1 className="mb-6 text-center text-lg font-semibold text-ink-900">
        パスワードの再設定
      </h1>

      {bannerError && (
        <div className="mb-4 rounded-lg bg-caution-50 px-4 py-3 text-sm text-caution-600">
          {bannerError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">新しいパスワード</Label>
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
          {mutation.isPending ? "再設定中..." : "パスワードを再設定"}
        </Button>
      </form>

      <div className="mt-6 flex justify-center text-sm">
        <Link to="/login" className="text-ink-500 hover:text-ink-900">
          ログインに戻る
        </Link>
      </div>
    </div>
  );
}
