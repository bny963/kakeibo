import type { ReactElement } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import LoginPage from "@/pages/LoginPage";
import * as AuthContextModule from "@/features/auth/AuthContext";

function renderWithProviders(ui: ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

function makeAxiosLikeError(status: number, data: unknown) {
  return { isAxiosError: true, response: { status, data } };
}

/**
 * テストケース一覧 No.2 / 権限設計 No.2: ログイン失敗時はメール・パスワードの
 * どちらが誤りかを特定しないメッセージのみを表示する。
 */
describe("LoginPage", () => {
  it("shows the backend's generic credential error without exposing which field is wrong", async () => {
    const login = vi.fn().mockRejectedValue(
      makeAxiosLikeError(422, {
        message: "The given data was invalid.",
        errors: { email: ["ログイン情報が登録されていません"] },
      }),
    );

    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: null,
      isLoading: false,
      login,
      register: vi.fn(),
      logout: vi.fn(),
      forgotPassword: vi.fn(),
      resetPassword: vi.fn(),
      updateProfile: vi.fn(),
    });

    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText("メールアドレス"), "satsuki@example.com");
    await user.type(screen.getByLabelText("パスワード"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "ログイン" }));

    await waitFor(() => {
      // バナーとフィールド直下の両方に同じ文言が表示される
      expect(screen.getAllByText("ログイン情報が登録されていません").length).toBeGreaterThan(0);
    });

    // 「メールアドレスが誤り」「パスワードが誤り」のような特定的な文言は出さない
    expect(screen.queryByText(/メールアドレスが(誤り|正しくありません)/)).not.toBeInTheDocument();
    expect(screen.queryByText(/パスワードが(誤り|正しくありません)/)).not.toBeInTheDocument();
  });
});
