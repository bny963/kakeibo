import * as React from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthContext";
import { getFieldErrors } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: () => forgotPassword(email),
    onError: (error) => setFieldErrors(getFieldErrors(error)),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    mutation.mutate();
  }

  if (mutation.isSuccess) {
    return (
      <div>
        <h1 className="mb-4 text-center text-lg font-semibold text-ink-900">
          パスワードリセット
        </h1>
        <p className="text-sm text-ink-500">
          パスワード再設定用のメールを送信しました（登録済みのメールアドレスの場合のみ届きます）。
          メール内のリンクから新しいパスワードを設定してください。
        </p>
        <div className="mt-6 flex justify-center text-sm">
          <Link to="/login" className="text-brand-600 hover:underline">
            ログインに戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-2 text-center text-lg font-semibold text-ink-900">
        パスワードをお忘れですか
      </h1>
      <p className="mb-6 text-center text-sm text-ink-500">
        登録済みのメールアドレスに再設定用のリンクを送信します
      </p>

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

        <Button type="submit" disabled={mutation.isPending} className="mt-2">
          {mutation.isPending ? "送信中..." : "リセットリンクを送信"}
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
