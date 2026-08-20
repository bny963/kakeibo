import * as React from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { getErrorMessage, getFieldErrors } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();

  const [name, setName] = React.useState(user?.name ?? "");
  const [nameError, setNameError] = React.useState<string | null>(null);
  const [isSavingName, setSavingName] = React.useState(false);

  const [currentPassword, setCurrentPassword] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [passwordConfirmation, setPasswordConfirmation] = React.useState("");
  const [passwordErrors, setPasswordErrors] = React.useState<Record<string, string>>({});
  const [isSavingPassword, setSavingPassword] = React.useState(false);

  React.useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNameError(null);
    setSavingName(true);
    try {
      await updateProfile({ name });
      toast({ title: "名前を更新しました", variant: "success" });
    } catch (error) {
      setNameError(getErrorMessage(error, "更新できませんでした"));
    } finally {
      setSavingName(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordErrors({});
    setSavingPassword(true);
    try {
      await updateProfile({
        name,
        current_password: currentPassword,
        password,
        password_confirmation: passwordConfirmation,
      });
      setCurrentPassword("");
      setPassword("");
      setPasswordConfirmation("");
      toast({ title: "パスワードを変更しました", variant: "success" });
    } catch (error) {
      setPasswordErrors(getFieldErrors(error));
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <h1 className="text-xl font-semibold text-ink-900">プロフィール設定</h1>

      <Card>
        <CardHeader>
          <CardTitle>お名前</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleNameSubmit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="profile-name">お名前</Label>
              <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} />
              {nameError && <p className="text-sm text-ink-400">{nameError}</p>}
            </div>
            <Button type="submit" disabled={isSavingName} className="w-fit">
              名前を更新
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>パスワード変更</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="current-password">現在のパスワード</Label>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              {passwordErrors.current_password && (
                <p className="text-sm text-ink-400">{passwordErrors.current_password}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-password">新しいパスワード</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {passwordErrors.password && (
                <p className="text-sm text-ink-400">{passwordErrors.password}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-password-confirmation">確認用パスワード</Label>
              <Input
                id="new-password-confirmation"
                type="password"
                autoComplete="new-password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={isSavingPassword} className="w-fit">
              パスワードを変更
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
