import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TransactionFormDialog } from "@/features/transactions/components/TransactionFormDialog";
import { ToastProvider } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { Transaction } from "@/types/api";

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const rent: Transaction = {
  id: 10,
  account_id: 1,
  category_id: 2,
  type: "expense",
  amount: "80000.00",
  date: "2026-09-01",
  note: "家賃",
  is_recurring: false,
  created_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-01T00:00:00Z",
};

function renderDialog(transaction: Transaction) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter>
          <TransactionFormDialog open onOpenChange={() => {}} transaction={transaction} />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.mocked(api.get).mockImplementation(async (url: string) => ({
    data:
      url === "/api/accounts"
        ? [{ id: 1, name: "現金", type: "cash", balance: "0.00" }]
        : url === "/api/categories"
          ? [
              { id: 2, name: "住居", type: "expense" },
              { id: 3, name: "給与", type: "income" },
            ]
          : [],
  }));
  vi.mocked(api.put).mockReset().mockResolvedValue({ data: { ...rent, is_recurring: true } });
});

describe("TransactionFormDialog: 固定費の支払い", () => {
  it("支出を固定費の支払いとして記録すると is_recurring: true を送る", async () => {
    renderDialog(rent);

    await userEvent.click(await screen.findByLabelText("固定費の支払いとして記録する"));
    await userEvent.click(screen.getByRole("button", { name: "保存する" }));

    await waitFor(() => expect(api.put).toHaveBeenCalled());
    expect(vi.mocked(api.put).mock.calls[0][1]).toMatchObject({ amount: 80000, is_recurring: true });
  });

  it("既存の固定費の取引を開くとチェックが入った状態になる", async () => {
    renderDialog({ ...rent, is_recurring: true });

    expect(await screen.findByLabelText("固定費の支払いとして記録する")).toBeChecked();
  });

  it("収入では固定費の選択肢を出さない", async () => {
    renderDialog(rent);

    await screen.findByLabelText("固定費の支払いとして記録する");
    await userEvent.click(screen.getByRole("button", { name: "収入" }));

    expect(screen.queryByLabelText("固定費の支払いとして記録する")).not.toBeInTheDocument();
  });
});
